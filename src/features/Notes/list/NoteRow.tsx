import type { INote } from '@nicoflow/shared/types';
import type { Locale } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import { Timestamp } from '@/components';

export interface NoteRowProps {
  note: INote;
  dateLocale?: Locale;
  onOpen: (id: string) => void;
}

// One list row: title, excerpt, relative updatedAt.
//
// The row renders `excerpt` — the server's 200-char plain-text summary — and
// deliberately nothing more. There is no `content` on the list shape at all, so
// a row can never be the editor's data source; opening one routes to the editor,
// which fetches the scalar. Same trap class as totalFocusSeconds being
// scalar-only (E-049).
export const NoteRow = ({ note, dateLocale, onOpen }: NoteRowProps) => {
  const { t } = useTranslation('notes');

  return (
    <button
      type="button"
      onClick={() => onOpen(note.id)}
      data-testid={`note-row-${note.id}`}
      className="hover:bg-accent/50 focus-visible:ring-ring flex w-full flex-col items-start gap-1 rounded-md border border-border px-3 py-2.5 text-start transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="w-full truncate text-sm font-medium text-foreground">{note.title || t('list.untitled')}</span>
      <span className="text-muted-foreground line-clamp-2 w-full text-xs">{note.excerpt || t('list.noExcerpt')}</span>
      <Timestamp date={note.updatedAt} locale={dateLocale} />
    </button>
  );
};
