import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

import { ENERGY_OPTIONS } from '@/components';
import { type ITask, TaskEnergy, TaskPriority } from '@/lib/types';

export type PriorityResult =
  | { kind: 'low'; className: string }
  | { kind: 'medium'; className: string }
  | { kind: 'high'; className: string }
  | { kind: 'unknown'; className: string };

// ── Gentle date chip ─────────────────────────────────────────────────────────
// The calm model: a soft scheduledFor never goes "overdue" — a past one reads
// as a neutral "carried over" chip. A hard dueDate is the only thing that can
// look urgent, and even then it's a calm amber "due", never alarmist red.
//
// `kind` drives the i18n label; `className` is the chip tone. No red anywhere.
const NEUTRAL_CHIP = 'text-muted-foreground bg-muted border-muted-foreground/40';
const CALM_DUE_CHIP = 'text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-300 dark:bg-amber-950/40';
const SOFT_CHIP = 'text-sky-700 bg-sky-50 border-sky-300 dark:text-sky-300 dark:bg-sky-950/40';

export type GentleDateResult =
  | { kind: 'carriedOver'; className: string } // soft scheduledFor in the past
  | { kind: 'scheduledToday'; className: string }
  | { kind: 'scheduledTomorrow'; className: string }
  | { kind: 'scheduledFuture'; className: string; formattedDate: string }
  | { kind: 'dueToday'; className: string } // hard dueDate today or past — calm amber
  | { kind: 'dueTomorrow'; className: string }
  | { kind: 'dueFuture'; className: string; formattedDate: string };

/**
 * Resolve the single gentle date chip for a task, preferring the soft
 * scheduledFor (roll-forward, never red) and falling back to the hard dueDate.
 * Returns null when the task carries neither. `now` is injectable for tests.
 */
export function formatTaskGentleDate(task: Pick<ITask, 'scheduledFor' | 'dueDate'>): GentleDateResult | null {
  if (task.scheduledFor) {
    const date = parseISO(task.scheduledFor);
    if (isToday(date)) return { kind: 'scheduledToday', className: SOFT_CHIP };
    if (isTomorrow(date)) return { kind: 'scheduledTomorrow', className: SOFT_CHIP };
    if (isPast(date)) return { kind: 'carriedOver', className: NEUTRAL_CHIP }; // never red
    return { kind: 'scheduledFuture', className: NEUTRAL_CHIP, formattedDate: format(date, 'MMM d, yyyy') };
  }

  if (task.dueDate) {
    const date = parseISO(task.dueDate);
    if (isTomorrow(date)) return { kind: 'dueTomorrow', className: NEUTRAL_CHIP };
    // today or past → calm amber "due", not alarmist
    if (isToday(date) || isPast(date)) return { kind: 'dueToday', className: CALM_DUE_CHIP };
    return { kind: 'dueFuture', className: NEUTRAL_CHIP, formattedDate: format(date, 'MMM d, yyyy') };
  }

  return null;
}

// Energy glyph for a task row — single source is ENERGY_OPTIONS (EnergyField).
export function getEnergyGlyph(energy: TaskEnergy) {
  return ENERGY_OPTIONS.find(option => option.value === energy) ?? ENERGY_OPTIONS[1]; // default medium
}

export function formatTaskPriority(priority: TaskPriority): PriorityResult {
  switch (priority) {
    case TaskPriority.LOW:
      return { kind: 'low', className: 'text-green-600 bg-green-50 border-green-600' };
    case TaskPriority.MEDIUM:
      return { kind: 'medium', className: 'text-yellow-600 bg-yellow-50 border-yellow-600' };
    case TaskPriority.HIGH:
      return { kind: 'high', className: 'text-red-600 bg-red-50 border-red-600' };
    default:
      return { kind: 'unknown', className: 'text-muted-foreground bg-muted border-muted-foreground' };
  }
}
