import { type KeyboardEvent, useState } from 'react';

import { Send, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { MAX_CONTENT_LENGTH } from '../../hooks';

// Show the counter only as the user nears the cap — avoids clutter on short turns.
const COUNTER_VISIBLE_FROM = MAX_CONTENT_LENGTH - 200;

export interface ComposerProps {
  // True while a stream is in flight: the input is disabled and the send button
  // becomes a stop button.
  streaming: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
}

// The message composer: an auto-clearing textarea with Enter-to-send /
// Shift+Enter-for-newline, a near-limit character counter, and a send button that
// flips to "Stop generating" while streaming. Over-limit or blank input can't be
// sent. Disabled during a stream to enforce the one-in-flight rule (mirrors the
// server 409).
export const Composer = ({ streaming, onSend, onStop }: ComposerProps) => {
  const { t } = useTranslation('ai');
  const [value, setValue] = useState('');

  const trimmed = value.trim();
  const overLimit = value.length > MAX_CONTENT_LENGTH;
  const canSend = trimmed.length > 0 && !overLimit && !streaming;

  const submit = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter (and IME composition) insert a newline instead.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
          rows={1}
          placeholder={streaming ? t('chat.composer.streamingPlaceholder') : t('chat.composer.placeholder')}
          aria-label={t('chat.composer.label')}
          aria-invalid={overLimit}
          className="max-h-40 min-h-[44px] resize-none"
          data-testid="ai-composer-input"
        />
        {streaming ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onStop}
            aria-label={t('chat.stop')}
            data-testid="ai-composer-stop"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={!canSend}
            aria-label={t('chat.composer.send')}
            data-testid="ai-composer-send"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>

      {value.length >= COUNTER_VISIBLE_FROM && (
        <div
          className={cn('mt-1 text-end text-xs', overLimit ? 'text-destructive' : 'text-muted-foreground')}
          aria-live="polite"
          data-testid="ai-composer-counter"
        >
          {value.length} / {MAX_CONTENT_LENGTH}
        </div>
      )}
    </div>
  );
};
