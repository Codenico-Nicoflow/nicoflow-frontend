import type { Editor } from '@tiptap/react';
import { Baseline, Highlighter } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { NOTE_COLOR_TOKENS, type NoteColorToken } from './colorTokens';

export type ColorPickerVariant = 'text' | 'highlight';

export interface ColorPickerProps {
  editor: Editor;
  variant: ColorPickerVariant;
  activeToken: NoteColorToken | null;
}

// The swatch reads its own color from the same --note-text-*/--note-highlight-*
// custom property the applied mark uses (editor.css), via an inline CSS
// variable rather than a per-token class, so this file doesn't need one class
// per token to stay in sync with the palette.
const swatchStyle = (variant: ColorPickerVariant, token: NoteColorToken): CSSProperties => {
  const property = variant === 'highlight' ? `--note-highlight-${token}` : `--note-text-${token}`;
  return variant === 'highlight' ? { backgroundColor: `var(${property})` } : { color: `var(${property})` };
};

// One fixed swatch grid per variant — deliberately no hex/RGB input anywhere
// (AC3): the only way to color a note is to pick one of these 8 tokens, or
// "Default" to clear the mark.
export const ColorPicker = ({ editor, variant, activeToken }: ColorPickerProps) => {
  const { t } = useTranslation('notes');

  const isHighlight = variant === 'highlight';
  const Icon = isHighlight ? Highlighter : Baseline;
  const groupLabel = t(isHighlight ? 'toolbar.highlightGroup' : 'toolbar.textColorGroup');

  const applyToken = (token: NoteColorToken) => {
    const chain = editor.chain().focus();
    if (isHighlight) chain.setNoteHighlight(token).run();
    else chain.setNoteTextColor(token).run();
  };

  const clear = () => {
    const chain = editor.chain().focus();
    if (isHighlight) chain.unsetNoteHighlight().run();
    else chain.unsetNoteTextColor().run();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={groupLabel}
          aria-pressed={activeToken !== null}
          className={cn('h-8 w-8', activeToken !== null && 'bg-accent text-accent-foreground')}
          data-testid={`note-${variant}-color-trigger`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-auto p-2">
        <button
          type="button"
          onClick={clear}
          className={cn(
            'hover:bg-accent mb-2 flex w-full items-center gap-2 rounded-sm px-2 py-1 text-sm',
            activeToken === null && 'bg-accent'
          )}
          data-testid={`note-${variant}-color-default`}
        >
          {t('toolbar.colorDefault')}
        </button>

        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={groupLabel}>
          {NOTE_COLOR_TOKENS.map(token => (
            <button
              key={token}
              type="button"
              aria-label={t(`toolbar.colors.${token}`)}
              aria-pressed={activeToken === token}
              onClick={() => applyToken(token)}
              data-testid={`note-${variant}-color-${token}`}
              style={swatchStyle(variant, token)}
              className={cn(
                'border-border h-6 w-6 rounded-full border',
                activeToken === token && 'ring-ring ring-offset-background ring-2 ring-offset-1'
              )}
            >
              {!isHighlight && (
                <span aria-hidden="true" className="text-xs font-semibold">
                  A
                </span>
              )}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
