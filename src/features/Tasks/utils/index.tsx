import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

import { ENERGY_OPTIONS } from '@/components';
import { type ITask, TaskEnergy, TaskPriority } from '@/lib/types';

export type PriorityResult =
  | { kind: 'low'; className: string }
  | { kind: 'medium'; className: string }
  | { kind: 'high'; className: string }
  | { kind: 'unknown'; className: string };

// ── Gentle date chip ─────────────────────────────────────────────────────────
// The calm model: a task's only date is the soft scheduledFor. It never goes
// "overdue" — a past one reads as a neutral "carried over" chip. No red anywhere.
//
// `kind` drives the i18n label; `className` is the chip tone.
const NEUTRAL_CHIP = 'text-muted-foreground bg-muted border-muted-foreground/40';
const SOFT_CHIP = 'text-sky-700 bg-sky-50 border-sky-300 dark:text-sky-300 dark:bg-sky-950/40';

export type GentleDateResult =
  | { kind: 'carriedOver'; className: string } // soft scheduledFor in the past
  | { kind: 'scheduledToday'; className: string }
  | { kind: 'scheduledTomorrow'; className: string }
  | { kind: 'scheduledFuture'; className: string; formattedDate: string };

/**
 * Resolve the single gentle date chip for a task from its soft scheduledFor
 * (roll-forward, never red). Returns null when the task is unscheduled.
 */
export function formatTaskGentleDate(task: Pick<ITask, 'scheduledFor'>): GentleDateResult | null {
  if (task.scheduledFor) {
    const date = parseISO(task.scheduledFor);
    if (isToday(date)) return { kind: 'scheduledToday', className: SOFT_CHIP };
    if (isTomorrow(date)) return { kind: 'scheduledTomorrow', className: SOFT_CHIP };
    if (isPast(date)) return { kind: 'carriedOver', className: NEUTRAL_CHIP }; // never red
    return { kind: 'scheduledFuture', className: NEUTRAL_CHIP, formattedDate: format(date, 'MMM d, yyyy') };
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
