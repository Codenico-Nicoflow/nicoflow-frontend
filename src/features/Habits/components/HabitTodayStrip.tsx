import { useEffect, useState } from 'react';

import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { useGetHabitsQuery, useGetHabitsTodayQuery } from '@/lib/store';
import type { IHabit } from '@/lib/types';
import { cn } from '@/lib/utils';

import { HABIT_FALLBACK_ICON, HABIT_SUBJECT_ICONS } from '../data';
import { withLingering } from '../habitUtils';
import { useHabitCheckIn } from '../useHabitCheckIn';

import { HabitRing } from './HabitRing';

// One habit in the strip: ring, name, streak. No ribbon — the strip is a
// five-second ritual, and history belongs on the habits page where there is room
// to read it.
const StripItem = ({ habit, isSyncing = false }: { habit: IHabit; isSyncing?: boolean }) => {
  const { t } = useTranslation('habits');
  const { toggle, isChecked, isPending } = useHabitCheckIn(habit);
  const SubjectIcon = HABIT_SUBJECT_ICONS[habit.subject] ?? HABIT_FALLBACK_ICON;

  return (
    <div
      // Fixed width, not shrink-to-fit: cards sized by their own text turned the
      // row into mismatched debris rather than a set of siblings.
      className="flex w-44 shrink-0 items-center gap-2.5 rounded-lg border bg-card px-3 py-2"
      data-testid={`habit-strip-item-${habit.id}`}
    >
      <HabitRing
        habit={habit}
        checked={isChecked}
        disabled={isPending || isSyncing}
        onToggle={toggle}
        compact
        data-testid={`habit-strip-ring-${habit.id}`}
      />
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <SubjectIcon className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate text-sm font-medium">{habit.name}</span>
        </span>
        {/* Always rendered, even when there is nothing to say: a line that
            appeared only above zero made some cards taller than others and
            broke the row's baseline.
            
            A quota habit shows this week's progress rather than its streak — at
            2 of 3 the streak is still 0, and printing "not started" there would
            be plainly false. */}
        <span
          className={cn(
            'block h-4 truncate text-xs tabular-nums transition-opacity',
            habit.periodProgress && habit.periodProgress.current >= habit.periodProgress.target
              ? 'text-green-600 dark:text-green-500'
              : 'text-muted-foreground',
            // The count comes from the server, so between the write landing and
            // the refetch arriving it is stale. Dimming it says "this number is
            // catching up" instead of showing a confident wrong value — a gap
            // that is invisible locally and real against a remote API.
            isSyncing && 'opacity-40'
          )}
        >
          {habit.periodProgress
            ? t('strip.periodProgress', {
                current: habit.periodProgress.current,
                target: habit.periodProgress.target,
              })
            : habit.currentStreak > 0
              ? t('streak', { count: habit.currentStreak, context: habit.streakUnit })
              : t('strip.notYet')}
        </span>
      </div>
    </div>
  );
};

// The habits strip on Today.
//
// It sits ABOVE the task list because the habit ritual is three taps and five
// seconds; below a twenty-task list it is never seen. With reminders deliberately
// out of v1, this placement carries the entire "remember to do it" job.
//
// Its own query, not a slice of the task time-spread: the server decides what is
// still owed — including the quota rule — so the client never reimplements "due".
export const HabitTodayStrip = () => {
  const { t } = useTranslation('habits');
  const { data: due, isLoading, isFetching, isError } = useGetHabitsTodayQuery();
  // The today feed returns [] both for "nothing left to do" and for "no habits
  // at all", and those want opposite treatments. The list answers which it is;
  // it is already cached by the habits page and shares the 'Habit' tag, so this
  // costs nothing on a warm cache.
  const { data: all } = useGetHabitsQuery();

  // Habits this session has rendered, so a check-in that removes one from the
  // feed can still be undone here rather than only on the habits page.
  const [shown, setShown] = useState<IHabit[]>([]);
  useEffect(() => {
    if (due) setShown(prev => withLingering(due, prev, all ?? []));
  }, [due, all]);

  // A failed strip is silent. It is a secondary surface on someone else's page,
  // and an error banner above the task list would be louder than the feature.
  if (isError) return null;

  // The skeleton mirrors the real row exactly — same heading, same card width,
  // same height — because anything narrower or shorter makes the layout jump
  // when the data lands. That jump is invisible against a local API answering
  // in single-digit milliseconds and obvious against a real one.
  if (isLoading) {
    return (
      <section className="space-y-2 border-b pb-4" data-testid="habit-strip-loading" aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-[52px] w-44 shrink-0 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!due) return null;

  // No habits at all ⇒ no strip and no empty frame: the user has not opted into
  // this feature, and Today is not the place to advertise it.
  if (shown.length === 0 && (all?.length ?? 0) === 0) return null;

  // Everything done ⇒ collapse to one quiet line rather than vanishing. A strip
  // that disappears on completion reads as a bug, not as an achievement.
  if (shown.length === 0) {
    return (
      <p
        className="flex items-center gap-1.5 border-b pb-4 text-sm text-muted-foreground"
        data-testid="habit-strip-done"
      >
        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
        {t('strip.allDone')}
      </p>
    );
  }

  return (
    <section aria-label={t('strip.label')} data-testid="habit-strip" className="space-y-2 border-b pb-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('strip.label')}</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {shown.map(habit => (
          // A lingering habit's snapshot is the one taken before it left the
          // feed, so its completedToday would be stale and the ring would try to
          // check in again instead of undoing. The full list carries the current
          // record; prefer it whenever it has one.
          <StripItem key={habit.id} habit={all?.find(h => h.id === habit.id) ?? habit} isSyncing={isFetching} />
        ))}
      </div>
    </section>
  );
};
