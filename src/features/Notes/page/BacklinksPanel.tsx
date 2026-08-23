import { Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components';
import { Skeleton } from '@/components/ui/skeleton';
import { getDateLocale } from '@/lib/i18n/dateLocale';
import { useGetBacklinksQuery } from '@/lib/store';

import { NoteRow } from '../list/NoteRow';

export interface BacklinksPanelProps {
  noteId: string;
}

// "Linked mentions" (NIC-1973) — the payoff of @note linking (NIC-1972):
// every other note that mentions this one, at the bottom of the full-page
// view. Reuses NoteRow (title + excerpt) since a backlink result is the same
// INote list shape the project note list already renders.
//
// Refetches on mount only (no WS event for this yet, per the story) — a
// stronger consistency need can be added later without changing this
// component's shape, since it's already a normal RTK Query cache read.
export const BacklinksPanel = ({ noteId }: BacklinksPanelProps) => {
  const { t, i18n } = useTranslation('notes');
  const navigate = useNavigate();
  const dateLocale = getDateLocale(i18n.language);

  const { data: backlinks, isLoading } = useGetBacklinksQuery(noteId, { skip: !noteId });

  return (
    <section data-testid="backlinks-panel" className="mt-6 space-y-3 border-t border-border pt-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Link2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        {t('backlinks.heading')}
      </h2>

      {isLoading ? (
        <div className="space-y-2" data-testid="backlinks-loading">
          {[0, 1].map(row => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      ) : !backlinks || backlinks.length === 0 ? (
        <EmptyState
          icon={Link2}
          title={t('backlinks.emptyTitle')}
          description={t('backlinks.emptyDescription')}
          data-testid="backlinks-empty"
        />
      ) : (
        <ul className="space-y-2" aria-label={t('backlinks.count', { count: backlinks.length })}>
          {backlinks.map(note => (
            <li key={note.id}>
              <NoteRow note={note} dateLocale={dateLocale} onOpen={id => navigate(`/notes/${id}`)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
