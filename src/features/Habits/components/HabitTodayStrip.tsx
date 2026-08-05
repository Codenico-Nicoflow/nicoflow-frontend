import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { useGetHabitsQuery, useGetHabitsTodayQuery } from '@/lib/store';
import type { IHabit } from '@/lib/types';

import { HABIT_FALLBACK_ICON, HABIT_SUBJECT_ICONS } from '../data';
import { useHabitCheckIn } from '../useHabitCheckIn';

import { HabitRing } from './HabitRing';

// One habit in the strip: ring, name, streak. No ribbon — the strip is a
// five-second ritual, and history belongs on the habits page where there is room
// to read it.
const StripItem = ({ habit }: { habit: IHabit }) => {
  const { t } = useTranslation('habits');
  const { toggle, isChecked, isPending } = useHabitCheckIn(habit);
  const SubjectIcon = HABIT_SUBJECT_ICONS[habit.subject] ?? HABIT_FALLBACK_ICON;

  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2"
      data-testid={`habit-strip-item-${habit.id}`}
    >
      <HabitRing
        habit={habit}
        checked={isChecked}
        disabled={isPending}
        onToggle={toggle}
        data-testid={`habit-strip-ring-${habit.id}`}
      />
      <div className="min-w-0">
        <span className="flex items-center gap-1.5">
          <SubjectIcon className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate text-sm font-medium">{habit.name}</span>
        </span>
        {habit.currentStreak > 0 ? (
          <span className="block text-xs text-muted-foreground tabular-nums">
            {t('streak', { count: habit.currentStreak, context: habit.streakUnit })}
          </span>
        ) : null}
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
  const { data: due, isLoading, isError } = useGetHabitsTodayQuery();
  // The today feed returns [] both for "nothing left to do" and for "no habits
  // at all", and those want opposite treatments. The list answers which it is;
  // it is already cached by the habits page and shares the 'Habit' tag, so this
  // costs nothing on a warm cache.
  const { data: all } = useGetHabitsQuery();

  // A failed strip is silent. It is a secondary surface on someone else's page,
  // and an error banner above the task list would be louder than the feature.
  if (isError) return null;

  if (isLoading) {
    return (
      <div className="flex gap-2" data-testid="habit-strip-loading">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!due) return null;

  // No habits at all ⇒ no strip and no empty frame: the user has not opted into
  // this feature, and Today is not the place to advertise it.
  if (due.length === 0 && (all?.length ?? 0) === 0) return null;

  // Everything done ⇒ collapse to one quiet line rather than vanishing. A strip
  // that disappears on completion reads as a bug, not as an achievement.
  if (due.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="habit-strip-done">
        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
        {t('strip.allDone')}
      </p>
    );
  }

  return (
    <section aria-label={t('strip.label')} data-testid="habit-strip">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {due.map(habit => (
          <StripItem key={habit.id} habit={habit} />
        ))}
      </div>
    </section>
  );
};
