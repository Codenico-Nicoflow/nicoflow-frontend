import { describe, expect, it } from 'vitest';

import { HOUR_HEIGHT_PX, HOURS_PER_DAY } from './data';
import {
  DEFAULT_CALENDAR_PREFS,
  hourHeightFor,
  hoursIn,
  isWorkday,
  resolveCalendarPrefs,
  visibleHourRange,
} from './displayPrefs';

describe('resolveCalendarPrefs', () => {
  it('returns the defaults when the server sent nothing', () => {
    expect(resolveCalendarPrefs(undefined)).toEqual(DEFAULT_CALENDAR_PREFS);
    expect(resolveCalendarPrefs(null)).toEqual(DEFAULT_CALENDAR_PREFS);
  });

  it('keeps a valid stored preference', () => {
    expect(resolveCalendarPrefs({ weekStart: 0, workdays: [0, 1, 2, 3, 4], dayStartHour: 8, dayEndHour: 18 })).toEqual({
      weekStart: 0,
      workdays: [0, 1, 2, 3, 4],
      dayStartHour: 8,
      dayEndHour: 18,
    });
  });

  // The grid cannot report a bad preference, so drawing the default is the only
  // honest option — a blank calendar with no explanation is worse.
  it.each([7, -1, 1.5, Number.NaN])('falls back for the unusable week start %j', weekStart => {
    expect(resolveCalendarPrefs({ weekStart }).weekStart).toBe(DEFAULT_CALENDAR_PREFS.weekStart);
  });

  it('drops out-of-range weekdays and keeps the rest', () => {
    expect(resolveCalendarPrefs({ workdays: [1, 9, 2, -3] }).workdays).toEqual([1, 2]);
  });

  it('falls back when every workday was unusable', () => {
    expect(resolveCalendarPrefs({ workdays: [9, 12] }).workdays).toEqual(DEFAULT_CALENDAR_PREFS.workdays);
  });

  it.each([
    ['inverted', 18, 8],
    ['empty', 9, 9],
    ['end past midnight', 0, 25],
    ['negative start', -1, 12],
  ])('falls back for an %s window', (_name, dayStartHour, dayEndHour) => {
    const prefs = resolveCalendarPrefs({ dayStartHour, dayEndHour });
    expect(prefs.dayStartHour).toBe(DEFAULT_CALENDAR_PREFS.dayStartHour);
    expect(prefs.dayEndHour).toBe(DEFAULT_CALENDAR_PREFS.dayEndHour);
  });

  // A malformed field must not cost the user an unrelated one.
  it('falls back per field, not wholesale', () => {
    const prefs = resolveCalendarPrefs({ weekStart: 99, dayStartHour: 8, dayEndHour: 18 });

    expect(prefs.weekStart).toBe(DEFAULT_CALENDAR_PREFS.weekStart);
    expect([prefs.dayStartHour, prefs.dayEndHour]).toEqual([8, 18]);
  });
});

describe('isWorkday', () => {
  const workweek = resolveCalendarPrefs({ workdays: [1, 2, 3, 4, 5] });

  it('accepts a chosen day', () => {
    // 2026-08-03 is a Monday.
    expect(isWorkday(new Date('2026-08-03T12:00:00'), workweek)).toBe(true);
  });

  it('rejects a hidden day', () => {
    expect(isWorkday(new Date('2026-08-02T12:00:00'), workweek)).toBe(false);
  });
});

describe('visibleHourRange', () => {
  const prefs = resolveCalendarPrefs({ dayStartHour: 8, dayEndHour: 18 });

  it('uses the chosen window when nothing falls outside it', () => {
    expect(visibleHourRange(prefs, [[9 * 60, 10 * 60]])).toEqual([8, 18]);
  });

  // The window is a default view, never a filter: silently hiding scheduled
  // work is indistinguishable from losing it.
  it('widens to include something scheduled earlier', () => {
    expect(visibleHourRange(prefs, [[6 * 60 + 30, 7 * 60]])).toEqual([6, 18]);
  });

  it('widens to include something scheduled later', () => {
    expect(visibleHourRange(prefs, [[21 * 60, 22 * 60 + 30]])).toEqual([8, 23]);
  });

  // The end is exclusive, so a block ending at 18:00 needs no extra row.
  it('does not widen for a block ending exactly on the boundary', () => {
    expect(visibleHourRange(prefs, [[17 * 60, 18 * 60]])).toEqual([8, 18]);
  });

  it('never exceeds the real day', () => {
    expect(visibleHourRange(prefs, [[0, MINUTES_IN_DAY]])).toEqual([0, HOURS_PER_DAY]);
  });

  it('returns the window unchanged with nothing scheduled', () => {
    expect(visibleHourRange(prefs)).toEqual([8, 18]);
  });
});

const MINUTES_IN_DAY = HOURS_PER_DAY * 60;

describe('hoursIn', () => {
  it('lists each drawn hour, excluding the exclusive end', () => {
    expect(hoursIn([8, 12])).toEqual([8, 9, 10, 11]);
  });

  it('always yields at least one row', () => {
    expect(hoursIn([8, 8])).toEqual([8]);
  });
});

describe('hourHeightFor', () => {
  it('leaves a full day at the base height', () => {
    expect(hourHeightFor([0, HOURS_PER_DAY], HOUR_HEIGHT_PX)).toBe(HOUR_HEIGHT_PX);
  });

  // The point of narrowing the day is to spend the reclaimed space on the hours
  // that remain, so 15- and 30-minute blocks stop rendering identically.
  it('grows the rows when the window is narrower', () => {
    expect(hourHeightFor([8, 18], HOUR_HEIGHT_PX)).toBeGreaterThan(HOUR_HEIGHT_PX);
  });

  it('caps the growth so one task cannot fill the viewport', () => {
    expect(hourHeightFor([9, 10], HOUR_HEIGHT_PX)).toBe(HOUR_HEIGHT_PX * 2);
  });

  it('never shrinks below the base height', () => {
    expect(hourHeightFor([0, HOURS_PER_DAY], HOUR_HEIGHT_PX)).toBeGreaterThanOrEqual(HOUR_HEIGHT_PX);
  });
});
