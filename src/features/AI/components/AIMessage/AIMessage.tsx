import { AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';

import { cn } from '@/lib/utils';

import type { PendingStatus } from '../../hooks';
import type { AIMessageRole } from '../../types';

import { markdownOptions } from './markdown';

// Assistant markdown wrapper. Child selectors give minimal, RTL-safe spacing +
// safe-link styling without pulling in a typography plugin. The list styling is
// intentional: GFM task-lists and ordered/unordered lists must read as lists.
const PROSE =
  'space-y-2 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-foreground/10 [&_pre]:p-3 [&_pre>code]:bg-transparent [&_pre>code]:p-0 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-5 [&_ol]:ps-5';

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
// code. Assistant text is rendered through the HARDENED markdown config (see
// markdown.tsx): HTML escaped, images blocked, links forced safe. User turns are
// the caller's own input, rendered as plain text. A failed user turn shows an
// inline error + retry; a streaming assistant turn shows a blinking caret.
export const AIMessage = ({ role, content, status, errorCode, streaming, onRetry }: AIMessageProps) => {
  const { t } = useTranslation('ai');
  const isUser = role === 'user';
  const failed = status === 'error';

  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')} data-testid={`ai-message-${role}`}>
      <div
        className={cn(
          'max-w-[85%] break-words rounded-2xl px-4 py-2 text-sm',
          isUser ? 'whitespace-pre-wrap bg-primary text-primary-foreground' : 'bg-muted text-foreground',
          failed && 'border border-destructive'
        )}
      >
        {isUser ? (
          content
        ) : (
          <div className={PROSE}>
            <Markdown {...markdownOptions}>{content}</Markdown>
          </div>
        )}
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
