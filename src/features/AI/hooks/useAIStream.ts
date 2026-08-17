import { useCallback, useRef, useState } from 'react';

import { AI_API } from '@nicoflow/shared/types';
import { useStore } from 'react-redux';

import type { RootState } from '@/lib/store';
import {
  aiApi,
  invalidateApiTags,
  refreshSessionFromStore,
  taskApi,
  useAppDispatch,
  webTokenStorage,
} from '@/lib/store';

import type { AIMessageView, AIToolName, PendingToolProposal } from '../types';

import { SSEParser } from './sseParser';

// Max content length — mirrors the backend guard (INVALID_INPUT above this).
export const MAX_CONTENT_LENGTH = 2000;

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1';

// A turn the hook manages locally on top of the persisted history. The optimistic
// user turn and the in-flight assistant turn live here until a reload pulls the
// server-persisted versions; `status` drives the per-message UX (spinner on the
// streaming assistant turn, retry affordance on a failed user turn).
export type PendingStatus = 'sending' | 'streaming' | 'done' | 'error';

export interface PendingMessage extends AIMessageView {
  kind?: 'message';
  status: PendingStatus;
  // Set on a failed turn — the §4 error code, so the UI keys UX off the code
  // (upgrade prompt for AI_LIMIT_REACHED, retry for the rest), never the status.
  errorCode?: string;
}

// A union of everything that can appear in the pending array.
export type PendingTurn = PendingMessage | PendingToolProposal;

// send outcome so callers/tests can react without reading state; the terminal
// event kind, or 'aborted' when abort() cut a live stream.
export type SendOutcome = 'done' | 'error' | 'aborted';

export interface UseAIStream {
  pending: PendingTurn[];
  isStreaming: boolean;
  send: (sessionId: string, content: string) => Promise<SendOutcome>;
  abort: () => void;
  retry: () => Promise<SendOutcome>;
  reset: () => void;
  // Resolves true only when the action actually applied (done/aborted) — false
  // on any failure (409 already-resolved, network error, stream failure), so
  // the caller never reports success for a call that didn't take effect.
  confirmTool: (toolUseId: string, sessionId: string) => Promise<boolean>;
  rejectTool: (toolUseId: string, sessionId: string) => Promise<boolean>;
}

const now = () => new Date().toISOString();

const extractEnvelopeCode = (body: unknown): string => {
  if (body && typeof body === 'object') {
    const error = (body as { error?: unknown }).error;
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code?: unknown }).code;
      if (typeof code === 'string' && code) return code;
    }
  }
  return 'AI_PROVIDER_ERROR';
};

export const useAIStream = (): UseAIStream => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  const [pending, setPending] = useState<PendingTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<{ sessionId: string; userId: string; content: string } | null>(null);

  const patchMessage = useCallback((id: string, changes: Partial<PendingMessage>) => {
    setPending(prev =>
      prev.map(m => {
        if (m.id !== id) return m;
        if (m.kind === 'tool_proposal') return m;
        return { ...m, ...changes };
      })
    );
  }, []);

  const patchProposal = useCallback((toolUseId: string, changes: Partial<PendingToolProposal>) => {
    setPending(prev =>
      prev.map(m => {
        if (m.kind !== 'tool_proposal' || m.id !== toolUseId) return m;
        return { ...m, ...changes };
      })
    );
  }, []);

  // Opens an authenticated fetch stream. 401 → refresh once → retry.
  const openStream = useCallback(
    async (url: string, body: unknown, controller: AbortController): Promise<Response> => {
      const bearer = store.getState().auth.token;
      const makeRequest = async (token: string | null) =>
        fetch(`${API_BASE}${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(body),
          signal: controller.signal,
        });

      let response = await makeRequest(bearer);
      if (response.status === 401) {
        const fresh = await refreshSessionFromStore(webTokenStorage, dispatch);
        if (fresh) response = await makeRequest(fresh);
      }
      return response;
    },
    [dispatch, store]
  );

  // Drains an SSE stream into pending turns, starting a new assistant text turn
  // as deltas arrive. Returns the outcome and the final assistant text (if any).
  const drainStream = useCallback(
    async (response: Response, sessionId: string, assistantId: string, onDone: () => void): Promise<SendOutcome> => {
      if (!response.body) return 'error';

      const parser = new SSEParser();
      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let assistant = '';
      let outcome: SendOutcome | null = null;

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const event of parser.feed(decoder.decode(value, { stream: true }))) {
            if (event.type === 'delta') {
              assistant += event.text;
              patchMessage(assistantId, { content: assistant });
            } else if (event.type === 'done') {
              patchMessage(assistantId, { id: event.messageId, content: assistant, status: 'done' });
              dispatch(aiApi.util.upsertQueryData('getAIUsage', undefined, event.usage));
              invalidateApiTags(dispatch, aiApi, [{ type: 'AISession', id: sessionId }]);
              outcome = 'done';
            } else if (event.type === 'tool_proposal') {
              const proposal: PendingToolProposal = {
                kind: 'tool_proposal',
                id: event.toolUseId,
                role: 'assistant',
                createdAt: now(),
                status: 'pending_confirm',
                tool: {
                  name: event.toolName as AIToolName,
                  input: event.input,
                  assistantMessageId: event.assistantMessageId,
                },
              };
              setPending(prev => [...prev, proposal]);
              // Stream ends after tool_proposal — no done follows in this turn.
              outcome = 'done';
            } else {
              patchMessage(assistantId, { content: assistant, status: 'error' });
              outcome = 'error';
            }
          }
        }
      } catch {
        if (controllerRef.current?.signal.aborted) outcome = 'aborted';
      }

      onDone();

      if (outcome === 'aborted') {
        patchMessage(assistantId, { content: assistant, status: 'done' });
        return 'aborted';
      }
      if (outcome === null) {
        patchMessage(assistantId, { content: assistant, status: 'error' });
        return 'error';
      }
      return outcome;
    },
    [dispatch, patchMessage]
  );

  const run = useCallback(
    async (sessionId: string, userId: string, assistantId: string, content: string): Promise<SendOutcome> => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsStreaming(true);

      const fail = (code: string): SendOutcome => {
        setPending(prev =>
          prev.map(m => {
            if (m.kind === 'tool_proposal') return m;
            if (m.id === userId) return { ...m, status: 'error' as const, errorCode: code };
            if (m.id === assistantId) return { ...m, status: 'error' as const };
            return m;
          })
        );
        controllerRef.current = null;
        setIsStreaming(false);
        return 'error';
      };

      let response: Response;
      try {
        response = await openStream(AI_API.MESSAGES(sessionId), { content }, controller);
      } catch {
        controllerRef.current = null;
        setIsStreaming(false);
        if (controller.signal.aborted) return 'aborted';
        return fail('AI_PROVIDER_ERROR');
      }

      if (!response.ok || !response.body) {
        const body: unknown = await response.json().catch(() => null);
        return fail(extractEnvelopeCode(body));
      }

      patchMessage(userId, { status: 'done' });
      patchMessage(assistantId, { status: 'streaming' });

      return drainStream(response, sessionId, assistantId, () => {
        controllerRef.current = null;
        setIsStreaming(false);
      });
    },
    [drainStream, openStream, patchMessage]
  );

  const send = useCallback(
    async (sessionId: string, content: string): Promise<SendOutcome> => {
      if (controllerRef.current) return 'error';

      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();
      const timestamp = now();
      lastSendRef.current = { sessionId, userId, content };

      setPending([
        { kind: 'message', id: userId, role: 'user', content, createdAt: timestamp, status: 'sending' },
        { kind: 'message', id: assistantId, role: 'assistant', content: '', createdAt: timestamp, status: 'streaming' },
      ]);

      return run(sessionId, userId, assistantId, content);
    },
    [run]
  );

  const retry = useCallback(async (): Promise<SendOutcome> => {
    const last = lastSendRef.current;
    if (!last || controllerRef.current) return 'error';

    const assistantId = crypto.randomUUID();
    const timestamp = now();
    setPending([
      {
        kind: 'message',
        id: last.userId,
        role: 'user',
        content: last.content,
        createdAt: timestamp,
        status: 'sending',
      },
      { kind: 'message', id: assistantId, role: 'assistant', content: '', createdAt: timestamp, status: 'streaming' },
    ]);
    return run(last.sessionId, last.userId, assistantId, last.content);
  }, [run]);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    if (controllerRef.current) return;
    setPending([]);
  }, []);

  // confirmTool / rejectTool: streams the follow-up SSE response from the
  // confirm/reject endpoints. Behaviour mirrors run() but targets a tool endpoint
  // and writes the follow-up text as a NEW turn below the proposal card.
  const runToolAction = useCallback(
    async (
      toolUseId: string,
      sessionId: string,
      endpoint: string,
      successStatus: 'done' | 'rejected',
      onConfirmed: () => void
    ): Promise<boolean> => {
      // Respect the one-in-flight guard — same behaviour as send().
      if (controllerRef.current) return false;

      patchProposal(toolUseId, { status: 'executing' });

      const controller = new AbortController();
      controllerRef.current = controller;
      setIsStreaming(true);

      const followUpId = crypto.randomUUID();
      const timestamp = now();

      let response: Response;
      try {
        response = await openStream(endpoint, {}, controller);
      } catch {
        controllerRef.current = null;
        setIsStreaming(false);
        if (!controller.signal.aborted) {
          patchProposal(toolUseId, { status: 'error', errorMessage: 'Network error' });
        }
        return false;
      }

      if (!response.ok || !response.body) {
        controllerRef.current = null;
        setIsStreaming(false);
        if (response.status === 409) {
          patchProposal(toolUseId, { status: 'error', alreadyResolved: true, errorMessage: 'Already resolved' });
        } else {
          const body: unknown = await response.json().catch(() => null);
          patchProposal(toolUseId, { status: 'error', errorMessage: extractEnvelopeCode(body) });
        }
        return false;
      }

      // Append a new assistant follow-up turn below the proposal card.
      setPending(prev => [
        ...prev,
        {
          kind: 'message' as const,
          id: followUpId,
          role: 'assistant' as const,
          content: '',
          createdAt: timestamp,
          status: 'streaming' as const,
        },
      ]);

      const outcome = await drainStream(response, sessionId, followUpId, () => {
        controllerRef.current = null;
        setIsStreaming(false);
      });

      if (outcome === 'done' || outcome === 'aborted') {
        patchProposal(toolUseId, { status: successStatus });
        onConfirmed();
        return true;
      }
      // Keep proposal actionable (retriable) on non-409 stream failures.
      patchProposal(toolUseId, { status: 'error', errorMessage: 'Stream failed' });
      return false;
    },
    [drainStream, openStream, patchProposal]
  );

  const confirmTool = useCallback(
    async (toolUseId: string, sessionId: string): Promise<boolean> => {
      return runToolAction(
        toolUseId,
        sessionId,
        `/ai/sessions/${sessionId}/tool-calls/${toolUseId}/confirm`,
        'done',
        () => {
          // On confirmed, invalidate task tags so open task views reflect the mutation.
          invalidateApiTags(dispatch, taskApi, ['Task', 'Focus', 'TimeSpread']);
        }
      );
    },
    [dispatch, runToolAction]
  );

  const rejectTool = useCallback(
    async (toolUseId: string, sessionId: string): Promise<boolean> => {
      return runToolAction(
        toolUseId,
        sessionId,
        `/ai/sessions/${sessionId}/tool-calls/${toolUseId}/reject`,
        'rejected',
        () => {}
      );
    },
    [runToolAction]
  );

  return { pending, isStreaming, send, abort, retry, reset, confirmTool, rejectTool };
};
