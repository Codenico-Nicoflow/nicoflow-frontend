import { Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';

import { AIChat } from './components/AIChat';

interface AIChatPanelProps {
  sessionId?: string;
}

// The flex chat area. With no session selected it shows the pick-a-conversation
// empty state; with one it mounts AIChat (keyed by id so switching sessions
// resets the thread + in-flight stream state), which owns the history read,
// composer, streaming render, stop, and autoscroll.
export const AIChatPanel = ({ sessionId }: AIChatPanelProps) => {
  const { t } = useTranslation('ai');

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center p-6" data-testid="ai-chat-empty">
        <EmptyState icon={Bot} title={t('chat.emptyTitle')} description={t('chat.emptyDescription')} />
      </div>
    );
  }

  return <AIChat key={sessionId} sessionId={sessionId} />;
};
