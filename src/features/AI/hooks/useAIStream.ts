import { useCallback, useRef, useState } from 'react';

import { useStore } from 'react-redux';

import type { RootState } from '@/lib/store';
import { aiApi, invalidateApiTags, refreshSessionFromStore, useAppDispatch } from '@/lib/store';
import { AI_API } from '@/lib/types';

import type { AIMessageView } from '../types';

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
  status: PendingStatus;
  // Set on a failed turn — the §4 error code, so the UI keys UX off the code
  // (upgrade prompt for AI_LIMIT_REACHED, retry for the rest), never the status.
  errorCode?: string;
}

// send outcome so callers/tests can react without reading state; the terminal
// event kind, or 'aborted' when abort() cut a live stream.
export type SendOutcome = 'done' | 'error' | 'aborted';

export interface UseAIStream {
  // The turns the hook is currently tracking (optimistic user + streaming
  // assistant), in send order. Empty between sends.
  pending: PendingMessage[];
  // True while a stream is opening or flowing — the caller disables the composer
  // to enforce one-in-flight (mirrors the server's 409 AI_STREAM_ACTIVE guard).
  isStreaming: boolean;
  send: (sessionId: string, content: string) => Promise<SendOutcome>;
  abort: () => void;
  // Re-send the last failed user turn (clears its error and streams again).
  retry: () => Promise<SendOutcome>;
}

const now = () => new Date().toISOString();

// extractEnvelopeCode reads error.code out of a pre-stream error envelope
// ({ data: null, error: { code, message } }). Falls back to a generic code so the
// UI always has something to key off, never an empty string.
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

// useAIStream is the send-message streaming engine: it owns exactly one in-flight
// stream, appends an optimistic user turn, opens the SSE-over-POST stream via
// fetch (NOT EventSource — it can't POST or carry a Bearer), accumulates delta
// text into the assistant turn, and maps a pre-stream failure to a retryable
// error keyed by error.code. On done it writes fresh usage into the RTK cache and
// invalidates ['AISession', id] so the persisted history refetches.
export const useAIStream = (): UseAIStream => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // The controller for the live stream; abort() fires it, and a new send never
  // starts while one exists (the caller also guards via isStreaming).
  const controllerRef = useRef<AbortController | null>(null);
  // The last user turn, kept so retry() can re-send it verbatim.
  const lastSendRef = useRef<{ sessionId: string; userId: string; content: string } | null>(null);

  // patch mutates one tracked turn by id (identity-stable across re-renders).
  const patch = useCallback((id: string, changes: Partial<PendingMessage>) => {
    setPending(prev => prev.map(m => (m.id === id ? { ...m, ...changes } : m)));
  }, []);

  const run = useCallback(
    async (sessionId: string, userId: string, assistantId: string, content: string): Promise<SendOutcome> => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsStreaming(true);

      // openStream fires the POST with the current access token; a 401 during
      // setup runs the shared single-flight refresh once, then retries with the
      // fresh token. No refresh mid-stream — a mid-stream 401 kills the stream.
      const openStream = async (bearer: string | null): Promise<Response> =>
        fetch(`${API_BASE}${AI_API.MESSAGES(sessionId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ content }),
          signal: controller.signal,
        });

      // fail marks the user turn retryable with the given code and finalizes the
      // stream — releasing the in-flight guard so a retry can run.
      const fail = (code: string): SendOutcome => {
        setPending(prev =>
          prev.map(m => {
            if (m.id === userId) return { ...m, status: 'error', errorCode: code };
            if (m.id === assistantId) return { ...m, status: 'error' };
            return m;
          })
        );
        controllerRef.current = null;
        setIsStreaming(false);
        return 'error';
      };

      let response: Response;
      try {
        response = await openStream(store.getState().auth.token);
        if (response.status === 401) {
          const fresh = await refreshSessionFromStore(dispatch, store.getState);
          if (fresh) response = await openStream(fresh);
        }
      } catch {
        controllerRef.current = null;
        setIsStreaming(false);
        if (controller.signal.aborted) return 'aborted';
        return fail('AI_PROVIDER_ERROR');
      }

      // Pre-stream error: the envelope carries the typed code; surface it on the
      // user turn as a retry affordance. The code (not the status) drives the UX.
      if (!response.ok || !response.body) {
        const body: unknown = await response.json().catch(() => null);
        return fail(extractEnvelopeCode(body));
      }

      // 200 committed → the assistant turn is now streaming.
      patch(assistantId, { status: 'streaming' });

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
              patch(assistantId, { content: assistant });
            } else if (event.type === 'done') {
              patch(assistantId, { id: event.messageId, content: assistant, status: 'done' });
              // Fresh quota straight into the cache (no refetch race) + refetch the
              // persisted session so the canonical turns replace the local ones.
              dispatch(aiApi.util.upsertQueryData('getAIUsage', undefined, event.usage));
              invalidateApiTags(dispatch, aiApi, [{ type: 'AISession', id: sessionId }]);
              outcome = 'done';
            } else {
              // Terminal error mid-stream: the server already persisted the partial,
              // so keep the rendered text and flag the assistant turn as errored.
              patch(assistantId, { content: assistant, status: 'error' });
              outcome = 'error';
            }
          }
        }
      } catch {
        // abort() aborts the reader → keep the partial (server persisted it).
        if (controller.signal.aborted) outcome = 'aborted';
      } finally {
        controllerRef.current = null;
        setIsStreaming(false);
      }

      if (outcome === 'aborted') {
        // Freeze the partial as a completed turn — a reload matches the server.
        patch(assistantId, { content: assistant, status: 'done' });
        return 'aborted';
      }
      // A stream that closed with no terminal event (connection dropped) is an
      // error on the assistant turn, partial kept.
      if (outcome === null) {
        patch(assistantId, { content: assistant, status: 'error' });
        return 'error';
      }
      return outcome;
    },
    [dispatch, patch, store]
  );

  const send = useCallback(
    async (sessionId: string, content: string): Promise<SendOutcome> => {
      // One in-flight stream max — the caller also disables input, this is defence.
      if (controllerRef.current) return 'error';

      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();
      const timestamp = now();
      lastSendRef.current = { sessionId, userId, content };

      setPending([
        { id: userId, role: 'user', content, createdAt: timestamp, status: 'sending' },
        { id: assistantId, role: 'assistant', content: '', createdAt: timestamp, status: 'streaming' },
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
      { id: last.userId, role: 'user', content: last.content, createdAt: timestamp, status: 'sending' },
      { id: assistantId, role: 'assistant', content: '', createdAt: timestamp, status: 'streaming' },
    ]);
    return run(last.sessionId, last.userId, assistantId, last.content);
  }, [run]);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  return { pending, isStreaming, send, abort, retry };
};
