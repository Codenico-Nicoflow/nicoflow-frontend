import { Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useGetAISessionQuery } from '@/lib/store';

interface AIChatPanelProps {
  sessionId?: string;
}

// The flex chat area. This scaffold story ships the message-history read only —
// no composer / streaming yet (owned by the chat story). With no session
// selected it shows the pick-a-conversation empty state; with one, it loads the
// session detail and lists the persisted turns.
export const AIChatPanel = ({ sessionId }: AIChatPanelProps) => {
  const { t } = useTranslation('ai');
  const { data: session, isLoading } = useGetAISessionQuery(sessionId ?? '', { skip: !sessionId });

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center p-6" data-testid="ai-chat-empty">
        <EmptyState icon={Bot} title={t('chat.emptyTitle')} description={t('chat.emptyDescription')} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="ai-chat-panel">
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-4" data-testid="ai-chat-loading">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-3/4" />
            ))}
          </div>
        ) : (
          <ul className="space-y-4">
            {session?.messages.map(message => (
              <li
                key={message.id}
                className="rounded-lg bg-card p-3 text-sm text-foreground"
                data-testid={`ai-message-${message.id}`}
              >
                {message.content}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t p-4 text-center text-xs text-muted-foreground">{t('chat.placeholder')}</div>
    </div>
  );
};
