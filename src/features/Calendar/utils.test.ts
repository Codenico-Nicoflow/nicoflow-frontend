import { describe, expect, it } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import { DAYS_PER_WEEK, MAX_RANGE_DAYS, MONTH_GRID_DAYS } from './data';
import {
  groupByDayKey,
  monthGridWeeks,
  parseDayParam,
  parseViewParam,
  rangeFor,
  shiftAnchor,
  toDayKey,
  todayKeyIn,
  visibleDays,
} from './utils';

const AUG_5 = new Date(2026, 7, 5); // a Wednesday

describe('parseViewParam', () => {
  it.each([
    ['day', 'day'],
    ['week', 'week'],
    ['month', 'month'],
  ])('accepts %s', (input, expected) => {
    expect(parseViewParam(input)).toBe(expected);
  });

  it.each([[null], ['garbage']])('falls back to week for %s', input => {
    expect(parseViewParam(input)).toBe('week');
  });
});

describe('parseDayParam', () => {
  it('parses an ISO date', () => {
    expect(toDayKey(parseDayParam('2026-08-05', AUG_5))).toBe('2026-08-05');
  });

  it.each([[null], ['not-a-date']])('falls back for %s rather than yielding Invalid Date', input => {
    expect(toDayKey(parseDayParam(input, AUG_5))).toBe('2026-08-05');
  });
});

describe('visibleDays', () => {
  it('renders one day in day view', () => {
    expect(visibleDays('day', AUG_5).map(toDayKey)).toEqual(['2026-08-05']);
  });

  it('renders a Monday-first week', () => {
    expect(visibleDays('week', AUG_5).map(toDayKey)).toEqual([
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ]);
  });
});

describe('rangeFor', () => {
  it('requests exactly the rendered day', () => {
    expect(rangeFor('day', AUG_5)).toEqual({ scheduledFrom: '2026-08-05', scheduledTo: '2026-08-05' });
  });

  it('requests the whole visible week', () => {
    expect(rangeFor('week', AUG_5)).toEqual({ scheduledFrom: '2026-08-03', scheduledTo: '2026-08-09' });
  });

  it('requests the padded month grid, including the leading/trailing days', () => {
    expect(rangeFor('month', AUG_5)).toEqual({ scheduledFrom: '2026-07-27', scheduledTo: '2026-09-06' });
  });

  it('keeps a month inside the server 62-day cap', () => {
    const { scheduledFrom, scheduledTo } = rangeFor('month', AUG_5);
    const span = (Date.parse(scheduledTo) - Date.parse(scheduledFrom)) / 86_400_000 + 1;
    expect(span).toBeLessThanOrEqual(MAX_RANGE_DAYS);
  });
});

describe('shiftAnchor', () => {
  it('steps a day at a time in day view', () => {
    expect(toDayKey(shiftAnchor('day', AUG_5, 1))).toBe('2026-08-06');
    expect(toDayKey(shiftAnchor('day', AUG_5, -1))).toBe('2026-08-04');
  });

  it('steps a week at a time in week view', () => {
    expect(toDayKey(shiftAnchor('week', AUG_5, 1))).toBe('2026-08-12');
    expect(toDayKey(shiftAnchor('week', AUG_5, -1))).toBe('2026-07-29');
  });

  it('steps a calendar month at a time in month view', () => {
    expect(toDayKey(shiftAnchor('month', AUG_5, 1))).toBe('2026-09-05');
    expect(toDayKey(shiftAnchor('month', AUG_5, -1))).toBe('2026-07-05');
  });
});

describe('visibleDays — month', () => {
  it('always returns whole weeks', () => {
    expect(visibleDays('month', AUG_5)).toHaveLength(MONTH_GRID_DAYS);
  });

  // A ragged grid would misalign every weekday column beneath it, and a 5-row
  // month next to a 6-row one would jump the layout on every navigation.
  it.each([
    ['a month starting on the week start', new Date(2026, 5, 15)], // June 2026 starts Monday
    ['a 28-day February', new Date(2026, 1, 10)],
    ['a leap February', new Date(2028, 1, 10)],
    ['a month ending on the week end', new Date(2026, 4, 10)], // May 2026 ends Sunday
  ])('fills six complete weeks for %s', (_label, anchor) => {
    const days = visibleDays('month', anchor);
    expect(days).toHaveLength(MONTH_GRID_DAYS);
    expect(days.length % DAYS_PER_WEEK).toBe(0);
  });

  it('opens on the week start and closes on the week end', () => {
    const days = visibleDays('month', AUG_5);
    expect(days[0]!.getDay()).toBe(1); // Monday
    expect(days[days.length - 1]!.getDay()).toBe(0); // Sunday
  });

  it('pads a leap February with the adjacent months', () => {
    // Feb 2028 starts on a Tuesday and has 29 days, so the grid must borrow a
    // leading Monday from January and trail well into March.
    const days = visibleDays('month', new Date(2028, 1, 10)).map(toDayKey);
    expect(days[0]).toBe('2028-01-31');
    expect(days).toContain('2028-02-29');
    expect(days[days.length - 1]).toBe('2028-03-12');
  });

  it('yields consecutive days with no gap across a month boundary', () => {
    const days = visibleDays('month', AUG_5);
    days.slice(1).forEach((day, index) => {
      const gap = (day.getTime() - days[index]!.getTime()) / 86_400_000;
      expect(Math.round(gap)).toBe(1);
    });
  });
});

describe('monthGridWeeks', () => {
  it('splits the padded grid into six rows of seven', () => {
    const weeks = monthGridWeeks(visibleDays('month', AUG_5));
    expect(weeks).toHaveLength(6);
    weeks.forEach(week => expect(week).toHaveLength(DAYS_PER_WEEK));
  });

  it('keeps the days in order across the row boundary', () => {
    const weeks = monthGridWeeks(visibleDays('month', AUG_5));
    expect(toDayKey(weeks[0]![0]!)).toBe('2026-07-27');
    expect(toDayKey(weeks[1]![0]!)).toBe('2026-08-03');
  });
});

describe('todayKeyIn', () => {
  // 2026-08-05 22:30 UTC is already the 6th in Tokyo and still the 5th in NY.
  const INSTANT = new Date('2026-08-05T22:30:00Z');

  it.each([
    ['Asia/Tokyo', '2026-08-06'],
    ['America/New_York', '2026-08-05'],
    ['UTC', '2026-08-05'],
  ])('resolves the account day in %s', (timezone, expected) => {
    expect(todayKeyIn(timezone, INSTANT)).toBe(expected);
  });

  it('falls back to browser-local when the account has no timezone', () => {
    expect(todayKeyIn(undefined, INSTANT)).toBe(toDayKey(INSTANT));
  });

  it('falls back rather than throwing on an unknown zone', () => {
    expect(todayKeyIn('Mars/Olympus_Mons', INSTANT)).toBe(toDayKey(INSTANT));
  });
});

describe('groupByDayKey', () => {
  it('buckets by scheduledFor and preserves server order', () => {
    const grouped = groupByDayKey([
      makeTask({ id: 'a', scheduledFor: '2026-08-05', scheduledTime: null }),
      makeTask({ id: 'b', scheduledFor: '2026-08-05', scheduledTime: '09:00' }),
      makeTask({ id: 'c', scheduledFor: '2026-08-06', scheduledTime: '10:00' }),
    ]);
    expect(grouped.get('2026-08-05')?.map(task => task.id)).toEqual(['a', 'b']);
    expect(grouped.get('2026-08-06')?.map(task => task.id)).toEqual(['c']);
  });

  it('drops unscheduled tasks', () => {
    expect(groupByDayKey([makeTask({ id: 'a', scheduledFor: null })]).size).toBe(0);
  });
});
