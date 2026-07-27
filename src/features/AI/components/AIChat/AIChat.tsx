import { useEffect, useMemo } from 'react';

import { AlertTriangle, ArrowDown, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAISessionQuery } from '@/lib/store';

import { useAIStream } from '../../hooks';
import { AIMessage } from '../AIMessage/AIMessage';

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
  const { pending, isStreaming, send, abort, retry, reset } = useAIStream();
  const { ref, pinned, scrollToBottom, jumpToLatest } = useAutoScroll<HTMLDivElement>();

  const history = useMemo(() => session?.messages ?? [], [session?.messages]);

  // Only show tracked turns the persisted history hasn't absorbed yet. After a
  // done send the refetched history contains the assistant turn (same id), so we
  // drop the whole tracked set to avoid a duplicate flash.
  const historyIds = useMemo(() => new Set(history.map(m => m.id)), [history]);
  const extraTurns = pending.filter(p => !historyIds.has(p.id));

  // Once the refetched history contains the streamed assistant turn (matched by
  // its real id), the tracked set is redundant — drop it so no turn renders twice.
  const assistant = pending.find(p => p.role === 'assistant');
  const merged = assistant?.status === 'done' && historyIds.has(assistant.id);
  useEffect(() => {
    if (!isStreaming && merged) reset();
  }, [isStreaming, merged, reset]);

  // Follow new content (deltas, new turns) whenever pinned to the bottom.
  useEffect(() => {
    scrollToBottom();
  }, [history.length, extraTurns, scrollToBottom]);

  const handleSend = (content: string) => {
    jumpToLatest();
    void send(sessionId, content);
  };

  // A failed history load with nothing streamed locally is a hard error — show a
  // retry state instead of a misleading empty thread. If turns are already on
  // screen (mid-conversation refetch blip) we keep them and let the composer's
  // own error path surface the next failure.
  const loadFailed = isError && history.length === 0 && extraTurns.length === 0;
  const isEmpty = !isLoading && !isError && history.length === 0 && extraTurns.length === 0;

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
          <div className="space-y-3">
            {history.map(m => (
              <AIMessage key={m.id} role={m.role} content={m.content} />
            ))}
            {extraTurns.map(m => (
              <AIMessage
                key={m.id}
                role={m.role}
                content={m.content}
                status={m.status}
                errorCode={m.errorCode}
                streaming={m.role === 'assistant' && m.status === 'streaming'}
                onRetry={m.role === 'user' && m.status === 'error' ? () => void retry() : undefined}
              />
            ))}
          </div>
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

      {/* No composer while the session itself failed to load — retry first. */}
      {!loadFailed && <Composer streaming={isStreaming} onSend={handleSend} onStop={abort} />}
    </div>
  );
};
