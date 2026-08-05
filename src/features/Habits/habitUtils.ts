import { HabitScheduleKind, type IHabit, type IHabitCell } from '@/lib/types';

// Pure habit helpers. Deliberately framework-agnostic — no DOM, no React, no
// i18n instance — so this module moves into @nicoflow/shared under E-033 without
// a rewrite, and the future mobile app derives the same ribbon from the same
// code rather than a second implementation that drifts.
//
// Nothing here computes a streak. Every number the UI renders comes from the
// server; these functions group and format what it already decided.

// A run of consecutive satisfied cells, plus the cells that broke or bridged it.
// The ribbon renders runs as one continuous bar, which is what turns a streak
// from a number you read into a shape you scan.
export type RibbonSegment = {
  kind: 'run' | 'gap' | 'unscheduled';
  cells: IHabitCell[];
};

// toRibbonRuns collapses cells into contiguous segments.
//
// The load-bearing rule: an **unscheduled** cell does not break a run. A
// Mon/Wed/Fri habit checked in on Monday and Wednesday is one unbroken run with
// a hairline Tuesday inside it — treating that Tuesday as a gap would show four
// failures a week the user never had.
//
// A *missed scheduled* cell does break the run, because that is a real miss.
export const toRibbonRuns = (cells: IHabitCell[]): RibbonSegment[] => {
  const segments: RibbonSegment[] = [];

  for (const cell of cells) {
    const kind: RibbonSegment['kind'] = !cell.scheduled ? 'unscheduled' : cell.satisfied ? 'run' : 'gap';
    const last = segments.at(-1);

    // Unscheduled cells sit inside the surrounding run rather than splitting it.
    if (kind === 'unscheduled' && last?.kind === 'run') {
      last.cells.push(cell);
      continue;
    }

    if (last?.kind === kind) {
      last.cells.push(cell);
      continue;
    }

    segments.push({ kind, cells: [cell] });
  }

  return segments;
};

// runLength counts only the satisfied cells in a segment, so an unscheduled day
// riding inside a run doesn't inflate the bar's reported length.
export const runLength = (segment: RibbonSegment): number => segment.cells.filter(c => c.satisfied).length;

// How many cells the ribbon shows at a given width. It narrows the window
// rather than shrinking the cells: below about 4px a cell is neither legible
// nor tappable, so fitting 30 of them on a phone would be a worse answer than
// showing 14.
export const ribbonWindowSize = (width: number): number => {
  if (width < 640) return 14;
  if (width < 1024) return 21;
  return 30;
};

// Trims a cell window to the most recent `size` entries. Cells arrive
// oldest-first, so the tail is the recent end.
export const takeRecentCells = (cells: IHabitCell[], size: number): IHabitCell[] =>
  size >= cells.length ? cells : cells.slice(cells.length - size);

// Whether the ring should accept a tap. An off-schedule or archived habit is
// visible but not actionable — dimmed rather than hidden, since hiding it reads
// as data loss.
export const isCheckable = (habit: IHabit): boolean => habit.archivedAt === null && habit.dueToday;

// Fraction of today's target already logged, clamped to 0…1 for the ring.
//
// A quit habit is all-or-nothing: it is satisfied by *not* exceeding its target,
// so a partial fill would imply progress toward something the user is trying to
// avoid.
export const todayProgress = (habit: IHabit): number => {
  if (habit.polarity === 'quit') return habit.completedToday ? 1 : 0;
  if (habit.periodProgress) {
    const { current, target } = habit.periodProgress;
    return target <= 0 ? 0 : Math.min(1, current / target);
  }
  if (habit.targetValue <= 0) return habit.completedToday ? 1 : 0;
  return Math.min(1, habit.todayValue / habit.targetValue);
};

// The i18n key and count for a habit's schedule summary ("Every day",
// "Mon, Wed, Fri", "3× a week"). Returns a key rather than a string so the
// module stays free of an i18n instance.
export type ScheduleSummary =
  | { key: 'schedule.daily' }
  | { key: 'schedule.weekdays'; days: number[] }
  | { key: 'schedule.quota'; count: number };

export const scheduleSummary = (habit: IHabit): ScheduleSummary => {
  if (habit.scheduleKind === HabitScheduleKind.WEEKDAYS) {
    return { key: 'schedule.weekdays', days: habit.byWeekday ?? [] };
  }
  if (habit.scheduleKind === HabitScheduleKind.WEEKLY_QUOTA) {
    return { key: 'schedule.quota', count: habit.timesPerWeek ?? 0 };
  }
  return { key: 'schedule.daily' };
};

// Streak milestones worth celebrating. Deliberately sparse: a celebration that
// fires every day stops being one within a week, and it delays the next tap.
export const STREAK_MILESTONES = [7, 30, 100, 365] as const;

export const isMilestone = (streak: number): boolean => (STREAK_MILESTONES as readonly number[]).includes(streak);
