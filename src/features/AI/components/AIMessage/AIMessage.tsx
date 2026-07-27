import { AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import type { PendingStatus } from '../../hooks';
import type { AIMessageRole } from '../../types';

type ErrorKey =
  | 'chat.error.generic'
  | 'chat.error.limitReached'
  | 'chat.error.unavailable'
  | 'chat.error.provider'
  | 'chat.error.invalidInput';

// Maps a pre-stream error.code (SPEC §4) to a translatable reason. Unknown codes
// fall back to the generic key so a new backend code still renders a message.
const errorKey = (code: string | undefined): ErrorKey => {
  switch (code) {
    case 'AI_LIMIT_REACHED':
      return 'chat.error.limitReached';
    case 'AI_UNAVAILABLE':
      return 'chat.error.unavailable';
    case 'AI_PROVIDER_ERROR':
      return 'chat.error.provider';
    case 'INVALID_INPUT':
      return 'chat.error.invalidInput';
    default:
      return 'chat.error.generic';
  }
};

export interface AIMessageProps {
  role: AIMessageRole;
  content: string;
  // Present only for hook-tracked turns; persisted history omits it.
  status?: PendingStatus;
  errorCode?: string;
  // True while this assistant turn is actively receiving deltas — shows a caret.
  streaming?: boolean;
  // Retry affordance for a failed user turn.
  onRetry?: () => void;
}

// One chat bubble. User turns sit at the inline-end (primary), assistant turns at
// the inline-start (muted) — logical properties so RTL mirrors with no extra
// code. Markdown rendering is deliberately out of scope (sibling security story);
// text renders as-is with newlines preserved. A failed user turn shows an inline
// error + retry; a streaming assistant turn shows a blinking caret.
export const AIMessage = ({ role, content, status, errorCode, streaming, onRetry }: AIMessageProps) => {
  const { t } = useTranslation('ai');
  const isUser = role === 'user';
  const failed = status === 'error';

  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')} data-testid={`ai-message-${role}`}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
          failed && 'border border-destructive'
        )}
      >
        {content}
        {streaming && (
          <span className="ms-0.5 inline-block h-4 w-1.5 animate-pulse bg-current align-text-bottom" aria-hidden />
        )}
      </div>

      {failed && (
        <div className="flex items-center gap-2 text-xs text-destructive" data-testid="ai-message-error">
          <AlertCircle className="size-3.5" aria-hidden />
          <span>{t(errorKey(errorCode))}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:no-underline"
              data-testid="ai-message-retry"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {t('chat.retry')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
