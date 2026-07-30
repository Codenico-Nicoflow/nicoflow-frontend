import { describe, expect, it } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import { MAX_RANGE_DAYS, MONTH_GRID_DAYS } from './data';
import { groupByDayKey, parseDayParam, parseViewParam, rangeFor, shiftAnchor, toDayKey, visibleDays } from './utils';

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
