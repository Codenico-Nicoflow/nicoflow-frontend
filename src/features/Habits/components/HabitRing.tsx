import { Check, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { IHabit } from '@/lib/types';
import { cn } from '@/lib/utils';

import { todayProgress } from '../habitUtils';

// Geometry for the progress ring. A stroke-dasharray sweep rather than a
// conic-gradient so the fill animates smoothly and inherits currentColor in
// both themes without a second set of tokens.
// The board's ring is a primary control and sized like one. The Today strip
// runs several across a narrow row above the task list, where that weight reads
// as clutter, so it takes the compact size instead.
const SIZE = 44;
const COMPACT_SIZE = 32;
const STROKE = 4;

export interface HabitRingProps {
  habit: IHabit;
  disabled?: boolean;
  /**
   * Whether the ring reads as checked. The caller owns this rather than the ring
   * deriving it from `habit.completedToday`, because it is the *optimistic*
   * answer during a tap — and it has to be able to show UNchecked while an undo
   * is still in flight, which an `|| completedToday` fallback could never do.
   */
  checked: boolean;
  onToggle: () => void;
  /** Smaller ring for dense rows like the Today strip. */
  compact?: boolean;
  'data-testid'?: string;
}

// The check-in control.
//
// A binary habit (target 1) renders as a checkbox; a counted one renders as a
// ring filled to today's fraction. Same component, same tap target — the target
// value decides the skin, so counts never needed a second control.
export const HabitRing = ({ habit, disabled = false, checked, onToggle, compact = false, ...rest }: HabitRingProps) => {
  const size = compact ? COMPACT_SIZE : SIZE;
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  const { t } = useTranslation('habits');

  // A period habit counts toward a target across the week, so "logged today" and
  // "finished" are different states and only the second earns a checkmark.
  // Conflating them made a 3x-a-week habit flash 1 -> tick -> 0 on every tap:
  // the tick replaced the count, then the refetch put the count back.
  const period = habit.periodProgress;
  const done = period ? period.current >= period.target : checked;

  // Optimistic, but only by one step. Filling the whole ring on tap would show a
  // 1-of-3 habit as complete; advancing one unit is what the tap actually did.
  const optimisticProgress = period
    ? Math.min(1, (period.current + (checked && !habit.loggedToday ? 1 : 0)) / Math.max(1, period.target))
    : 1;
  const progress = checked ? optimisticProgress : todayProgress(habit);

  // Only a habit with no period and a target of one is a pure checkbox; anything
  // that accumulates shows its number.
  const isBinary = habit.targetValue <= 1 && period === null;

  // What the slot shows when the habit is not finished: a period's running
  // count, or a counted day habit's value.
  const countLabel = period ? period.current + (checked && !habit.loggedToday ? 1 : 0) : habit.todayValue;

  // The label names the habit and its state, because an icon-only control tells
  // a screen reader nothing about which habit it belongs to.
  const label = habit.periodProgress
    ? t('ring.periodLabel', {
        name: habit.name,
        current: habit.periodProgress.current,
        target: habit.periodProgress.target,
      })
    : t('ring.label', { name: habit.name });

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={done}
      aria-label={label}
      data-testid={rest['data-testid'] ?? 'habit-ring'}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent'
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={STROKE} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={cn(
            done ? 'stroke-green-600 dark:stroke-green-500' : 'stroke-primary',
            // Motion is confined to the moment of completion, and it is the one
            // thing the user's own tap produced — safe to show optimistically.
            'transition-[stroke-dashoffset] duration-200 ease-out',
            'motion-reduce:transition-none'
          )}
          data-testid="habit-ring-progress"
        />
      </svg>

      <span className="absolute grid place-items-center">
        {done ? (
          <Check
            className={cn(compact ? 'h-4 w-4' : 'h-5 w-5', 'text-green-600 dark:text-green-500')}
            aria-hidden="true"
            data-testid="habit-ring-check"
          />
        ) : isBinary ? null : (
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground" data-testid="habit-ring-count">
            {countLabel}
          </span>
        )}
        {disabled && !done ? (
          <Minus className={cn(compact ? 'h-3 w-3' : 'h-4 w-4', 'text-muted-foreground')} aria-hidden="true" />
        ) : null}
      </span>
    </button>
  );
};
