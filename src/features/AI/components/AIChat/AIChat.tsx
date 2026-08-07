import { useEffect, useMemo } from 'react';

import { AlertTriangle, ArrowDown, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { EmptyState } from '@/components';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { PendingToolProposal } from '@/features/AI/types';
import { useGetAISessionQuery, useGetAreasWithProjectsQuery, useListPendingToolCallsQuery } from '@/lib/store';
import { ToastMessages } from '@/lib/utils';

import { useAIQuota, useAIStream } from '../../hooks';
import { applyServerBlock, isQuotaBlocked } from '../../quota';
import { AIMessage } from '../AIMessage/AIMessage';
import { AIToolProposal } from '../AIMessage/AIToolProposal';
import { AIDisabledBanner } from '../QuotaIndicator/AIDisabledBanner';
import { QuotaWall } from '../QuotaIndicator/QuotaWall';

import { Composer } from './Composer';
import { useAutoScroll } from './useAutoScroll';

export interface AIChatProps {
  sessionId: string;
}

// AIChat is the full conversation surface for one session: it reads the persisted
// history (RTK Query) and layers the in-flight optimistic turns from useAIStream
// on top, renders the composer + stop control, and follows new content with the
// pin/unpin autoscroll. On a completed send the hook invalidates the session tag,
// the history refetches, and the tracked turns are dropped so nothing renders
// twice.
export const AIChat = ({ sessionId }: AIChatProps) => {
  const { t } = useTranslation('ai');
  const { data: session, isLoading, isError, refetch } = useGetAISessionQuery(sessionId, { skip: !sessionId });
  const { pending, isStreaming, send, abort, retry, reset, confirmTool, rejectTool } = useAIStream();
  const { quota, featureDisabled } = useAIQuota();
  const { ref, pinned, scrollToBottom, jumpToLatest } = useAutoScroll<HTMLDivElement>();

  // Pending proposals from the server — used to rehydrate after reload.
  const { data: serverPendingCalls } = useListPendingToolCallsQuery(sessionId, { skip: !sessionId });

  // Areas-with-projects for project name lookups in tool proposals.
  const { data: areasWithProjects } = useGetAreasWithProjectsQuery();
  const projectNames = useMemo<Record<string, string>>(() => {
    if (!areasWithProjects) return {};
    const map: Record<string, string> = {};
    for (const area of areasWithProjects) {
      for (const project of area.projects ?? []) {
        map[project.id] = project.name;
      }
    }
    return map;
  }, [areasWithProjects]);

  const history = useMemo(() => session?.messages ?? [], [session?.messages]);

  const historyIds = useMemo(() => new Set(history.map(m => m.id)), [history]);
  const extraTurns = pending.filter(p => {
    // Tool proposals are never in persisted history by id, so always include them.
    if (p.kind === 'tool_proposal') return true;
    return !historyIds.has(p.id);
  });

  const assistant = pending.find(p => p.kind !== 'tool_proposal' && p.role === 'assistant');
  const merged =
    assistant !== undefined &&
    assistant.kind !== 'tool_proposal' &&
    assistant.status === 'done' &&
    historyIds.has(assistant.id);
  useEffect(() => {
    if (!isStreaming && merged) reset();
  }, [isStreaming, merged, reset]);

  // Synthetic pending proposals from server (reload rehydration): inject those
  // whose toolUseId is not already tracked locally.
  const localProposalIds = useMemo(
    () => new Set(pending.filter((p): p is PendingToolProposal => p.kind === 'tool_proposal').map(p => p.id)),
    [pending]
  );
  const rehydratedProposals = useMemo<PendingToolProposal[]>(() => {
    if (!serverPendingCalls) return [];
    return serverPendingCalls
      .filter(c => !localProposalIds.has(c.id))
      .map(c => ({
        kind: 'tool_proposal' as const,
        id: c.id,
        role: 'assistant' as const,
        createdAt: c.createdAt,
        status: 'pending_confirm' as const,
        tool: { name: c.toolName, input: c.input, assistantMessageId: c.assistantMessageId },
      }));
  }, [serverPendingCalls, localProposalIds]);

  useEffect(() => {
    scrollToBottom();
  }, [history.length, extraTurns, scrollToBottom]);

  const handleSend = (content: string) => {
    jumpToLatest();
    void send(sessionId, content);
  };

  const handleConfirm = (toolUseId: string) => {
    const proposal = [...pending, ...rehydratedProposals].find(
      (p): p is PendingToolProposal => p.kind === 'tool_proposal' && p.id === toolUseId
    );
    void confirmTool(toolUseId, sessionId).then(() => {
      // Toast keyed by tool name, matching ToastMessages for task mutations.
      if (proposal?.tool.name === 'complete_task') {
        toast.success(ToastMessages.TASK_UPDATED_SUCCESSFULLY);
      } else if (proposal?.tool.name === 'create_task') {
        toast.success(ToastMessages.TASK_CREATED_SUCCESSFULLY);
      } else if (proposal?.tool.name === 'reschedule_task') {
        toast.success(ToastMessages.TASK_UPDATED_SUCCESSFULLY);
      }
    });
  };

  const handleReject = (toolUseId: string) => {
    void rejectTool(toolUseId, sessionId);
  };

  const loadFailed = isError && history.length === 0 && extraTurns.length === 0;
  const isEmpty =
    !isLoading && !isError && history.length === 0 && extraTurns.length === 0 && rehydratedProposals.length === 0;

  const blockedBySend = pending.some(
    p => p.kind !== 'tool_proposal' && p.status === 'error' && isQuotaBlocked(p.errorCode)
  );
  const effectiveQuota = blockedBySend ? applyServerBlock(quota) : quota;
  const exhausted = effectiveQuota?.state === 'exhausted';

  if (featureDisabled) return <AIDisabledBanner />;

  // All displayable turns: persisted history + local pending + server rehydrated proposals.
  // Rehydrated proposals appear after history (they are from a prior send).
  const renderTurns = () => (
    <div className="space-y-3">
      {history
        .filter(m => m.content.trim() !== '')
        .map(m => (
          <AIMessage key={m.id} role={m.role} content={m.content} />
        ))}
      {rehydratedProposals.map(p => (
        <AIToolProposal
          key={p.id}
          toolUseId={p.id}
          toolName={p.tool.name}
          input={p.tool.input}
          status={p.status}
          projectNames={projectNames}
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      ))}
      {extraTurns.map(m => {
        if (m.kind === 'tool_proposal') {
          return (
            <AIToolProposal
              key={m.id}
              toolUseId={m.id}
              toolName={m.tool.name}
              input={m.tool.input}
              status={m.status}
              errorMessage={m.errorMessage}
              alreadyResolved={m.alreadyResolved}
              projectNames={projectNames}
              onConfirm={handleConfirm}
              onReject={handleReject}
            />
          );
        }
        // A finished assistant turn that streamed no text (e.g. the model went
        // straight to a tool_use with no preceding prose) has nothing to show —
        // skip the bubble. A turn still sending/streaming keeps rendering even
        // with empty content so its placeholder/caret stays visible.
        if (m.content.trim() === '' && m.status === 'done') return null;
        return (
          <AIMessage
            key={m.id}
            role={m.role}
            content={m.content}
            status={m.status}
            errorCode={m.errorCode}
            streaming={m.role === 'assistant' && m.status === 'streaming'}
            // A failed turn on EITHER side offers retry — the user's own turn
            // can fail before the request even goes out, and the assistant's
            // turn can fail mid-stream (e.g. a provider drop) after the user's
            // half already succeeded. retry() always resends the last user
            // message regardless of which side actually errored.
            onRetry={m.status === 'error' ? () => void retry() : undefined}
          />
        );
      })}
    </div>
  );

  return (
    <div className="relative flex h-full flex-col" data-testid="ai-chat">
      <div ref={ref} className="flex-1 overflow-y-auto p-4" data-testid="ai-chat-scroll">
        {isLoading ? (
          <div className="space-y-4" data-testid="ai-chat-loading">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-2/3" />
            ))}
          </div>
        ) : loadFailed ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={AlertTriangle}
              title={t('chat.loadErrorTitle')}
              description={t('chat.loadErrorDescription')}
              action={
                <Button variant="outline" size="sm" onClick={() => void refetch()} data-testid="ai-chat-retry">
                  {t('chat.retry')}
                </Button>
              }
              data-testid="ai-chat-error"
            />
          </div>
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState icon={Bot} title={t('chat.startTitle')} description={t('chat.startDescription')} />
          </div>
        ) : (
          renderTurns()
        )}
      </div>

      {!pinned && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={jumpToLatest}
          aria-label={t('chat.jumpToLatest')}
          data-testid="ai-chat-jump"
          className="absolute bottom-24 end-4 rounded-full shadow-md"
        >
          <ArrowDown className="size-4" />
        </Button>
      )}

      {!loadFailed &&
        (exhausted && !isStreaming && effectiveQuota ? (
          <QuotaWall quota={effectiveQuota} />
        ) : (
          <Composer streaming={isStreaming} onSend={handleSend} onStop={abort} />
        ))}
    </div>
  );
};
