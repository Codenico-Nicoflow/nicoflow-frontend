import { useEffect, useId, useState } from 'react';

import type { Editor } from '@tiptap/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { isAllowedLinkProtocol } from './extensions';

export interface LinkDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Replaces window.prompt: a native prompt can't be styled, can't be tested
// through the DOM, blocks the whole tab, and on an invalid URL the only way to
// explain the rule was a toast fired after the dialog had already closed. Here
// the error sits next to the field and the Save button stays disabled until the
// value is one the schema will actually accept.
export const LinkDialog = ({ editor, open, onOpenChange }: LinkDialogProps) => {
  const { t } = useTranslation('notes');
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState('');

  const existing = editor.getAttributes('link').href as string | undefined;

  // Seed from the link under the caret each time the dialog opens, so editing
  // an existing link starts from its current href rather than a blank field.
  useEffect(() => {
    if (open) setValue(existing ?? 'https://');
  }, [open, existing]);

  const trimmed = value.trim();
  const isEmpty = trimmed === '' || trimmed === 'https://';
  const isInvalid = !isEmpty && !isAllowedLinkProtocol(trimmed);

  const submit = () => {
    if (isEmpty || isInvalid) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
    onOpenChange(false);
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="note-link-dialog">
        <DialogHeader>
          <DialogTitle>{t('toolbar.linkTitle')}</DialogTitle>
          <DialogDescription>{t('toolbar.linkDescription')}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-2"
          onSubmit={event => {
            event.preventDefault();
            submit();
          }}
        >
          <Label htmlFor={inputId}>{t('toolbar.linkLabel')}</Label>
          <Input
            id={inputId}
            value={value}
            autoFocus
            inputMode="url"
            onChange={event => setValue(event.target.value)}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? errorId : undefined}
            data-testid="note-link-input"
          />
          {isInvalid && (
            <p id={errorId} role="alert" className="text-destructive text-sm">
              {t('toolbar.linkInvalid')}
            </p>
          )}
        </form>

        <DialogFooter className="gap-2 sm:justify-between">
          {existing ? (
            <Button type="button" variant="ghost" className="text-destructive" onClick={remove}>
              {t('toolbar.linkRemove')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('toolbar.linkCancel')}
            </Button>
            <Button type="button" onClick={submit} disabled={isEmpty || isInvalid} data-testid="note-link-save">
              {t('toolbar.linkSave')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
