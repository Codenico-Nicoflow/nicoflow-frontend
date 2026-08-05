import { describe, expect, it } from 'vitest';

import { makeHabit, makeHabitCell } from '@/mocks/handlers';

import {
  isCheckable,
  isMilestone,
  ribbonWindowSize,
  runLength,
  scheduleSummary,
  takeRecentCells,
  todayProgress,
  toRibbonRuns,
} from './habitUtils';

const cell = (satisfied: boolean, scheduled = true) => makeHabitCell({ satisfied, scheduled });

describe('toRibbonRuns', () => {
  it('groups consecutive satisfied cells into one run', () => {
    const segments = toRibbonRuns([cell(true), cell(true), cell(true)]);

    expect(segments).toHaveLength(1);
    expect(segments[0]!.kind).toBe('run');
    expect(segments[0]!.cells).toHaveLength(3);
  });

  it('splits a run at a missed day and preserves the gap', () => {
    const segments = toRibbonRuns([
      cell(true),
      cell(true),
      cell(true),
      cell(true),
      cell(true),
      cell(false),
      cell(true),
      cell(true),
      cell(true),
    ]);

    expect(segments.map(s => s.kind)).toEqual(['run', 'gap', 'run']);
    expect(runLength(segments[0]!)).toBe(5);
    expect(runLength(segments[2]!)).toBe(3);
  });

  // The rule the whole ribbon rests on: a Mon/Wed/Fri habit must read as one
  // continuous run, not four failures a week.
  it('keeps a run continuous across an unscheduled day', () => {
    const segments = toRibbonRuns([cell(true), cell(false, false), cell(true)]);

    expect(segments).toHaveLength(1);
    expect(segments[0]!.kind).toBe('run');
    expect(runLength(segments[0]!)).toBe(2);
  });

  it('reports leading unscheduled cells as their own segment', () => {
    const segments = toRibbonRuns([cell(false, false), cell(true)]);

    expect(segments.map(s => s.kind)).toEqual(['unscheduled', 'run']);
  });

  it('returns nothing for an empty window', () => {
    expect(toRibbonRuns([])).toEqual([]);
  });

  it('handles a single cell', () => {
    expect(toRibbonRuns([cell(true)])).toHaveLength(1);
  });
});

describe('ribbonWindowSize', () => {
  it.each([
    [375, 14],
    [639, 14],
    [640, 21],
    [1023, 21],
    [1024, 30],
    [1920, 30],
  ])('shows %i px wide as %i cells', (width, expected) => {
    expect(ribbonWindowSize(width)).toBe(expected);
  });
});

describe('takeRecentCells', () => {
  it('keeps the most recent cells when the window is smaller', () => {
    const cells = [
      makeHabitCell({ date: '2026-08-01' }),
      makeHabitCell({ date: '2026-08-02' }),
      makeHabitCell({ date: '2026-08-03' }),
    ];

    expect(takeRecentCells(cells, 2).map(c => c.date)).toEqual(['2026-08-02', '2026-08-03']);
  });

  it('returns everything when the window is larger than the history', () => {
    const cells = [makeHabitCell()];
    expect(takeRecentCells(cells, 30)).toHaveLength(1);
  });
});

describe('isCheckable', () => {
  it('allows a due, active habit', () => {
    expect(isCheckable(makeHabit({ dueToday: true }))).toBe(true);
  });

  it('refuses an off-schedule habit', () => {
    expect(isCheckable(makeHabit({ dueToday: false }))).toBe(false);
  });

  it('refuses an archived habit', () => {
    expect(isCheckable(makeHabit({ archivedAt: '2026-08-01T00:00:00Z' }))).toBe(false);
  });
});

describe('todayProgress', () => {
  it('is the fraction of the target logged today', () => {
    expect(todayProgress(makeHabit({ targetValue: 8, todayValue: 2 }))).toBe(0.25);
  });

  it('clamps above the target', () => {
    expect(todayProgress(makeHabit({ targetValue: 8, todayValue: 20 }))).toBe(1);
  });

  it('reads quota progress when the habit has a period', () => {
    const habit = makeHabit({
      scheduleKind: 'weekly_quota',
      timesPerWeek: 3,
      periodProgress: { current: 2, target: 3 },
    });

    expect(todayProgress(habit)).toBeCloseTo(2 / 3);
  });

  // A quit habit is satisfied by NOT exceeding its target, so a partial fill
  // would imply progress toward the thing the user is avoiding.
  it('is all-or-nothing for a quit habit', () => {
    expect(todayProgress(makeHabit({ polarity: 'quit', targetValue: 0, completedToday: true }))).toBe(1);
    expect(todayProgress(makeHabit({ polarity: 'quit', targetValue: 0, completedToday: false }))).toBe(0);
  });

  it('does not divide by a zero target', () => {
    expect(todayProgress(makeHabit({ targetValue: 0, completedToday: false }))).toBe(0);
  });
});

describe('scheduleSummary', () => {
  it('describes a daily habit', () => {
    expect(scheduleSummary(makeHabit({ scheduleKind: 'daily' }))).toEqual({ key: 'schedule.daily' });
  });

  it('describes named weekdays', () => {
    const habit = makeHabit({ scheduleKind: 'weekdays', byWeekday: [1, 3, 5] });

    expect(scheduleSummary(habit)).toEqual({ key: 'schedule.weekdays', days: [1, 3, 5] });
  });

  it('describes a weekly quota', () => {
    const habit = makeHabit({ scheduleKind: 'weekly_quota', timesPerWeek: 3 });

    expect(scheduleSummary(habit)).toEqual({ key: 'schedule.quota', count: 3 });
  });
});

describe('isMilestone', () => {
  it.each([7, 30, 100, 365])('celebrates %i', streak => {
    expect(isMilestone(streak)).toBe(true);
  });

  it.each([1, 6, 8, 29, 99])('stays quiet at %i', streak => {
    expect(isMilestone(streak)).toBe(false);
  });
});
