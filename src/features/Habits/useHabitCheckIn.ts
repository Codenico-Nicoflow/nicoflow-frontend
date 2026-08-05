import { useCallback, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCheckInMutation, useUndoCheckInMutation } from '@/lib/store';
import type { IHabit } from '@/lib/types';

import { isMilestone } from './habitUtils';

// The check-in interaction.
//
// The split between what is optimistic and what is not is deliberate:
//
//   - The RING fills instantly. That is local truth — the user just tapped it —
//     so showing it before the server agrees costs nothing if it fails.
//   - The STREAK waits for the response. It is the emotionally loaded number,
//     and a figure that ticks up and then visibly ticks back down is worse than
//     one that arrives 300ms late.
//
// On failure only the ring rolls back, on that one card. No number the user has
// already read is ever retracted.
export const useHabitCheckIn = (habit: IHabit) => {
  const { t } = useTranslation('habits');
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [undoCheckIn, { isLoading: isUndoing }] = useUndoCheckInMutation();

  // Local, per-card optimistic state. Deliberately not a cache patch: the server
  // recomputes the streak on write, and patching a derived number here would be
  // the client doing streak math — the one thing this feature does not do.
  const [pending, setPending] = useState<boolean | null>(null);

  const toggle = useCallback(async () => {
    const wasDone = habit.completedToday;
    setPending(!wasDone);

    try {
      const next = wasDone ? await undoCheckIn({ id: habit.id }).unwrap() : await checkIn({ id: habit.id }).unwrap();

      // Celebrate only at a milestone. A flourish that fires every day stops
      // being one within a week, and it delays the next tap.
      if (!wasDone && isMilestone(next.currentStreak)) {
        toast.success(t('toast.milestone', { count: next.currentStreak, context: next.streakUnit }));
      }
    } catch {
      toast.error(t('toast.checkInFailed'));
    } finally {
      // Clear the optimistic flag either way: on success the refetched habit is
      // now authoritative, on failure the ring returns to the stored truth.
      setPending(null);
    }
  }, [checkIn, undoCheckIn, habit.id, habit.completedToday, t]);

  return {
    toggle,
    // `pending` is null when idle, so `?? completedToday` falls through to the
    // server's answer rather than to `false`.
    isChecked: pending ?? habit.completedToday,
    isPending: isCheckingIn || isUndoing,
  };
};
