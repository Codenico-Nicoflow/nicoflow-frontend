import { AlertTriangle, NotebookPen, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { EmptyState } from '@/components';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDateLocale } from '@/lib/i18n/dateLocale';
import { useCreateNoteMutation, useGetNotesQuery } from '@/lib/store';
import { EMPTY_TIPTAP_DOC } from '@/lib/types';

import { NoteRow } from './NoteRow';

export interface NotesSectionProps {
  projectId: string;
}

// The Notes surface on a project page. Reference material that outlives a task.
// Notes are FREE and unlimited — there is no plan gate here and this surface
// never renders PLAN_LIMIT_EXCEEDED.
export const NotesSection = ({ projectId }: NotesSectionProps) => {
  const { t, i18n } = useTranslation('notes');
  const navigate = useNavigate();
  const dateLocale = getDateLocale(i18n.language);

  const { data: notes, isLoading, isError, refetch } = useGetNotesQuery({ projectId }, { skip: !projectId });
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();

  const handleCreate = async () => {
    try {
      // Content is optional on create, but sending the empty doc keeps the
      // client's idea of "new note" identical to the server's default.
      const note = await createNote({ projectId, title: '', content: EMPTY_TIPTAP_DOC }).unwrap();
      navigate(`/notes/${note.id}`);
    } catch {
      toast.error(t('list.createError'));
    }
  };

  return (
    <section data-testid="notes-section" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <NotebookPen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {t('list.heading')}
        </h2>
        <Button size="sm" onClick={() => void handleCreate()} disabled={isCreating} data-testid="notes-create">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('list.new')}
        </Button>
      </div>

      {/* Skeleton, not a spinner, and shaped like the rows so the layout doesn't
          jump when the data lands. */}
      {isLoading ? (
        <div className="space-y-2" data-testid="notes-loading">
          {[0, 1, 2].map(row => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title={t('list.loadErrorTitle')}
          description={t('list.loadErrorDescription')}
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()} data-testid="notes-retry">
              {t('list.retry')}
            </Button>
          }
          data-testid="notes-error"
        />
      ) : !notes || notes.length === 0 ? (
        // Empty state sits ABOVE a still-present surface rather than replacing
        // the section — the heading and create action stay reachable (the
        // pattern settled in the Calendar month view, NIC-1803).
        <EmptyState
          icon={NotebookPen}
          title={t('list.emptyTitle')}
          description={t('list.emptyDescription')}
          data-testid="notes-empty"
        />
      ) : (
        // Server order is updatedAt DESC — rendered as received. No client sort
        // and no manual reordering.
        <ul className="space-y-2" aria-label={t('list.count', { count: notes.length })}>
          {notes.map(note => (
            <li key={note.id}>
              <NoteRow note={note} dateLocale={dateLocale} onOpen={id => navigate(`/notes/${id}`)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
