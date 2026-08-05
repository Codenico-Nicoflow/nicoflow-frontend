import { useState } from 'react';

import { Archive, ArrowLeft, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useArchiveHabitMutation, useCheckInMutation, useGetHabitQuery, useUndoCheckInMutation } from '@/lib/store';

import { HabitFormDialog } from './components/HabitFormDialog';
import { HabitRibbonInteractive } from './components/HabitRibbonInteractive';
import { HabitsErrorState } from './states/HabitsErrorState';
import { editableCellDates, scheduleSummary } from './habitUtils';

// One habit, full width.
//
// This is where the ribbon finally has room to be itself: 84 cells rather than
// the card's 14, and every day inside the backfill window is a control, so a
// forgotten Tuesday can be fixed where the user can see the gap.
export const HabitDetailView = () => {
  const { t } = useTranslation('habits');
  const navigate = useNavigate();
  const { habitId = '' } = useParams();

  const { data: habit, isLoading, isError, refetch } = useGetHabitQuery(habitId, { skip: !habitId });
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [undoCheckIn, { isLoading: isUndoing }] = useUndoCheckInMutation();
  const [archiveHabit] = useArchiveHabitMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6" data-testid="habit-detail-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (isError || !habit) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <HabitsErrorState onRetry={() => void refetch()} />
      </div>
    );
  }

  const cells = habit.cells ?? [];
  const editable = editableCellDates(habit, cells);
  const summary = scheduleSummary(habit);

  // Toggling a past day is the same pair of endpoints as today's ring, just with
  // an explicit date. The server owns the window and rejects anything outside
  // it, so a stale client can never write a day it shouldn't.
  const toggleDay = async (date: string) => {
    const cell = cells.find(c => c.date === date);
    try {
      if (cell?.satisfied) {
        await undoCheckIn({ id: habit.id, date }).unwrap();
      } else {
        await checkIn({ id: habit.id, date }).unwrap();
      }
    } catch {
      toast.error(t('toast.checkInFailed'));
    }
  };

  const onArchive = async () => {
    try {
      await archiveHabit(habit.id).unwrap();
      toast.success(t('toast.archived'));
      void navigate('/habits');
    } catch {
      toast.error(t('toast.archiveFailed'));
    }
  };

  const scheduleLabel = summary.key === 'schedule.quota' ? t(summary.key, { count: summary.count }) : t(summary.key);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6" data-testid="habit-detail">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="-ms-2 mb-1"
            onClick={() => void navigate('/habits')}
            data-testid="habit-detail-back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('detail.back')}
          </Button>
          <h2 className="truncate text-2xl font-semibold">{habit.name}</h2>
          <p className="text-sm text-muted-foreground">
            {habit.unit ? `${habit.targetValue} ${habit.unit} · ${scheduleLabel}` : scheduleLabel}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} data-testid="habit-detail-edit">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            {t('detail.edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)} data-testid="habit-detail-archive">
            <Archive className="h-4 w-4" aria-hidden="true" />
            {t('detail.archive')}
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-4" data-testid="habit-detail-stats">
        <div>
          <dt className="text-xs text-muted-foreground">{t('detail.currentStreak')}</dt>
          <dd className="text-xl font-semibold tabular-nums" data-testid="habit-detail-current">
            {t('streak', { count: habit.currentStreak, context: habit.streakUnit })}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('detail.longestStreak')}</dt>
          <dd className="text-xl font-semibold tabular-nums" data-testid="habit-detail-longest">
            {t('streak', { count: habit.longestStreak, context: habit.streakUnit })}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('detail.completion')}</dt>
          <dd className="text-xl font-semibold tabular-nums" data-testid="habit-detail-rate">
            {completionRate(cells)}%
          </dd>
        </div>
      </dl>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">{t('detail.history')}</h3>
        <HabitRibbonInteractive
          cells={cells}
          streakUnit={habit.streakUnit}
          currentStreak={habit.currentStreak}
          editableDates={editable}
          onToggleDay={date => void toggleDay(date)}
          isBusy={isCheckingIn || isUndoing}
        />
        <p className="text-xs text-muted-foreground">
          {editable.size > 0 ? t('detail.backfillHint') : t('detail.readOnlyHint')}
        </p>
      </div>

      <HabitFormDialog open={editOpen} onOpenChange={setEditOpen} habit={habit} />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={t('detail.archiveConfirmTitle')}
        // Says plainly that nothing is destroyed — the alternative reading of
        // an "archive" button is that it is a polite word for delete.
        description={t('detail.archiveConfirmBody')}
        confirmLabel={t('detail.archive')}
        onConfirm={() => void onArchive()}
      />
    </section>
  );
};

// Share of scheduled days in the window that were satisfied. Unscheduled days
// are excluded from BOTH sides: a Mon/Wed/Fri habit that never misses is at
// 100%, not 43%.
const completionRate = (cells: { scheduled: boolean; satisfied: boolean }[]): number => {
  const scheduled = cells.filter(c => c.scheduled);
  if (scheduled.length === 0) return 0;
  return Math.round((scheduled.filter(c => c.satisfied).length / scheduled.length) * 100);
};
