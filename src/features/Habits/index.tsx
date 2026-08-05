import { useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components';
import { Button } from '@/components/ui/button';
import {
  useArchiveHabitMutation,
  useDeleteHabitMutation,
  useGetHabitsQuery,
  useRestoreHabitMutation,
} from '@/lib/store';
import type { IHabit } from '@/lib/types';
import { cn } from '@/lib/utils';

import { HabitFormDialog } from './components/HabitFormDialog';
import { HabitGrid } from './components/HabitGrid';
import { HabitsEmptyState } from './states/HabitsEmptyState';
import { HabitsErrorState } from './states/HabitsErrorState';
import { HabitsLoadingState } from './states/HabitsLoadingState';

type Segment = 'active' | 'archived';

// The habits board.
//
// Active and Archived are separate views rather than one mixed list: the Active
// count is exactly what the plan limit measures, and interleaving retired
// habits would make "3 of 3" read as a lie.
export const HabitsView = () => {
  const { t } = useTranslation('habits');
  const navigate = useNavigate();

  const [segment, setSegment] = useState<Segment>('active');
  // Archived habits come from the same endpoint with includeArchived, then are
  // filtered here — the API has no archived-only mode, and asking for one would
  // be a backend change to save a client-side filter.
  const { data, isLoading, isError, refetch } = useGetHabitsQuery(
    segment === 'archived' ? { includeArchived: true } : undefined
  );

  const [restoreHabit] = useRestoreHabitMutation();
  const [archiveHabit] = useArchiveHabitMutation();
  const [deleteHabit] = useDeleteHabitMutation();

  // One habit at a time is pending confirmation; which dialog is open says
  // which action it is.
  const [confirming, setConfirming] = useState<{ habit: IHabit; action: 'archive' | 'delete' } | null>(null);
  const [editing, setEditing] = useState<IHabit | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const habits = segment === 'archived' ? (data ?? []).filter(h => h.archivedAt !== null) : (data ?? []);

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  // Restoring consumes a plan slot, so it fails exactly like a create does.
  // The limit is surfaced as its own message rather than a generic error,
  // because the user can act on it — archive something else, or upgrade.
  const onRestore = async (id: string) => {
    try {
      await restoreHabit(id).unwrap();
      toast.success(t('toast.restored'));
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'data' in error
          ? ((error as { data?: { error?: { code?: string } } }).data?.error?.code ?? '')
          : '';

      toast.error(code === 'PLAN_LIMIT_EXCEEDED' ? t('form.errors.planLimit') : t('toast.restoreFailed'));
    }
  };

  const onConfirm = async () => {
    if (!confirming) return;
    const { habit, action } = confirming;

    try {
      if (action === 'delete') {
        await deleteHabit(habit.id).unwrap();
        toast.success(t('toast.deleted'));
      } else {
        await archiveHabit(habit.id).unwrap();
        toast.success(t('toast.archived'));
      }
    } catch {
      toast.error(t(action === 'delete' ? 'toast.deleteFailed' : 'toast.archiveFailed'));
    } finally {
      setConfirming(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6" data-testid="habits-view">
      {/* h2, not h1: the shared EmptyState renders an h3, and the page shell
          already owns the h1 — an h1→h3 jump is a real heading-order failure. */}
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">{t('title')}</h2>
        <Button onClick={openCreate} data-testid="habits-create">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('create')}
        </Button>
      </header>

      <div className="flex gap-1 rounded-md bg-muted p-1" role="group" aria-label={t('segments.label')}>
        {(['active', 'archived'] as const).map(value => (
          <button
            key={value}
            type="button"
            aria-pressed={segment === value}
            onClick={() => setSegment(value)}
            data-testid={`habits-segment-${value}`}
            className={cn(
              'flex-1 cursor-pointer rounded px-3 py-1.5 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              segment === value ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            )}
          >
            {t(value === 'active' ? 'segments.active' : 'segments.archived')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <HabitsLoadingState />
      ) : isError ? (
        <HabitsErrorState onRetry={() => void refetch()} />
      ) : habits.length > 0 ? (
        <HabitGrid
          habits={habits}
          onOpen={id => void navigate(`/habits/${id}`)}
          onRestore={id => void onRestore(id)}
          onEdit={habit => {
            setEditing(habit);
            setDialogOpen(true);
          }}
          onArchive={habit => setConfirming({ habit, action: 'archive' })}
          onDelete={habit => setConfirming({ habit, action: 'delete' })}
        />
      ) : segment === 'archived' ? (
        <p className="py-12 text-center text-sm text-muted-foreground" data-testid="habits-archived-empty">
          {t('segments.archivedEmpty')}
        </p>
      ) : (
        <HabitsEmptyState onCreate={openCreate} />
      )}

      <HabitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editing} />

      {/* Delete is the only action here that destroys anything, so it gets the
          destructive treatment and its own wording; archive says plainly that
          the history survives. */}
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={open => !open && setConfirming(null)}
        variant={confirming?.action === 'delete' ? 'danger' : 'warning'}
        destructive={confirming?.action === 'delete'}
        title={t(confirming?.action === 'delete' ? 'detail.deleteConfirmTitle' : 'detail.archiveConfirmTitle')}
        description={t(confirming?.action === 'delete' ? 'detail.deleteConfirmBody' : 'detail.archiveConfirmBody')}
        confirmLabel={t(confirming?.action === 'delete' ? 'detail.delete' : 'detail.archive')}
        onConfirm={() => void onConfirm()}
      />
    </section>
  );
};

export { HabitTodayStrip } from './components/HabitTodayStrip';
export { HabitDetailView } from './HabitDetailView';
