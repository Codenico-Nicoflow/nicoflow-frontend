import { useState } from 'react';

import type { INote } from '@nicoflow/shared/types';
import type { Locale } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog, ItemActionsMenu, Timestamp } from '@/components';
import { useDeleteNoteMutation } from '@/lib/store';

export interface NoteRowProps {
  note: INote;
  dateLocale?: Locale;
  onOpen: (id: string) => void;
}

// One list row: title, excerpt, relative updatedAt, 3-dot menu (Delete only).
//
// The row renders `excerpt` — the server's 200-char plain-text summary — and
// deliberately nothing more. There is no `content` on the list shape at all, so
// a row can never be the editor's data source; opening one routes to the editor,
// which fetches the scalar. Same trap class as totalFocusSeconds being
// scalar-only (E-049).
export const NoteRow = ({ note, dateLocale, onOpen }: NoteRowProps) => {
  const { t } = useTranslation('notes');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();

  const onConfirmDelete = async () => {
    try {
      await deleteNote(note.id).unwrap();
      setConfirmOpen(false);
    } catch {
      toast.error(t('page.deleteError'));
    }
  };

  return (
    <div className="hover:bg-accent/50 group flex w-full items-start gap-1 rounded-md border border-border px-3 py-2.5 transition-colors">
      <button
        type="button"
        onClick={() => onOpen(note.id)}
        data-testid={`note-row-${note.id}`}
        className="focus-visible:ring-ring flex min-w-0 flex-1 flex-col items-start gap-1 text-start focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="w-full truncate text-sm font-medium text-foreground">{note.title || t('list.untitled')}</span>
        <span className="text-muted-foreground line-clamp-2 w-full text-xs">{note.excerpt || t('list.noExcerpt')}</span>
        <Timestamp date={note.updatedAt} locale={dateLocale} />
      </button>

      <ItemActionsMenu
        triggerClassName="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
        data-testid={`note-row-${note.id}-actions`}
        actions={[{ label: t('page.delete'), icon: Trash2, onClick: () => setConfirmOpen(true), destructive: true }]}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('page.deleteConfirmTitle')}
        description={t('page.deleteConfirmBody')}
        icon={Trash2}
        variant="danger"
        confirmLabel={t('page.deleteConfirmAction')}
        onConfirm={onConfirmDelete}
        isLoading={isDeleting}
        destructive
        data-testid={`note-row-${note.id}-delete-dialog`}
      />
    </div>
  );
};
