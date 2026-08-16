import { MONTHDAY_LAST, RecurrenceFreq } from '@nicoflow/shared/types';
import { describe, expect, it } from 'vitest';

import { normalizeScheduleForFreq, summarizeRecurrence, validateRecurrence } from './recurrence';

const schedule = (over: Partial<Parameters<typeof validateRecurrence>[0]> = {}) => ({
  freq: RecurrenceFreq.WEEKLY,
  interval: 1,
  byWeekday: [1],
  byMonthday: null,
  startDate: '2026-03-02',
  endDate: null,
  ...over,
});

describe('summarizeRecurrence', () => {
  it('picks the daily key and carries the interval as count', () => {
    const s = summarizeRecurrence({ freq: RecurrenceFreq.DAILY, interval: 3, byWeekday: [], byMonthday: null });
    expect(s).toMatchObject({ key: 'summary.daily', count: 3 });
  });

  it('sorts weekdays ascending regardless of click order', () => {
    const s = summarizeRecurrence({ freq: RecurrenceFreq.WEEKLY, interval: 1, byWeekday: [4, 1], byMonthday: null });
    expect(s.key).toBe('summary.weekly');
    expect(s.weekdays).toEqual([1, 4]);
  });

  it('falls back to the bare frequency label when no weekday is chosen', () => {
    const s = summarizeRecurrence({ freq: RecurrenceFreq.WEEKLY, interval: 1, byWeekday: [], byMonthday: null });
    expect(s.key).toBe('freq.weekly');
  });

  it('distinguishes a monthday from the last-day sentinel', () => {
    expect(
      summarizeRecurrence({ freq: RecurrenceFreq.MONTHLY, interval: 1, byWeekday: [], byMonthday: 15 })
    ).toMatchObject({ key: 'summary.monthly', day: 15 });
    expect(
      summarizeRecurrence({ freq: RecurrenceFreq.MONTHLY, interval: 1, byWeekday: [], byMonthday: MONTHDAY_LAST })
    ).toMatchObject({ key: 'summary.monthlyLast' });
  });

  it('surfaces the end date so the caller can wrap it', () => {
    const s = summarizeRecurrence({
      freq: RecurrenceFreq.YEARLY,
      interval: 1,
      byWeekday: [],
      byMonthday: null,
      endDate: '2027-01-01',
    });
    expect(s).toMatchObject({ key: 'summary.yearly', endDate: '2027-01-01' });
  });
});

describe('validateRecurrence', () => {
  it('accepts a well-formed schedule', () => {
    expect(validateRecurrence(schedule())).toBeNull();
  });

  it.each([0, -1, 367, 1.5])('rejects interval %s', interval => {
    expect(validateRecurrence(schedule({ interval }))).toBe('intervalOutOfRange');
  });

  it('requires an explicit weekday on a weekly rule', () => {
    expect(validateRecurrence(schedule({ byWeekday: [] }))).toBe('weekdayRequired');
  });

  it('allows an empty weekday list on a non-weekly rule', () => {
    expect(validateRecurrence(schedule({ freq: RecurrenceFreq.DAILY, byWeekday: [] }))).toBeNull();
  });

  it.each([0, 32, -2])('rejects monthday %s', byMonthday => {
    expect(validateRecurrence(schedule({ freq: RecurrenceFreq.MONTHLY, byWeekday: [], byMonthday }))).toBe(
      'monthdayOutOfRange'
    );
  });

  it('accepts -1 as the last day of month', () => {
    expect(
      validateRecurrence(schedule({ freq: RecurrenceFreq.MONTHLY, byWeekday: [], byMonthday: MONTHDAY_LAST }))
    ).toBeNull();
  });

  it('rejects an end date before the start', () => {
    expect(validateRecurrence(schedule({ endDate: '2026-03-01' }))).toBe('endBeforeStart');
  });

  it('accepts an end date equal to the start', () => {
    expect(validateRecurrence(schedule({ endDate: '2026-03-02' }))).toBeNull();
  });
});

describe('normalizeScheduleForFreq', () => {
  it('drops byWeekday on a non-weekly rule', () => {
    const out = normalizeScheduleForFreq({ freq: RecurrenceFreq.DAILY, byWeekday: [1, 3], byMonthday: null });
    expect(out.byWeekday).toEqual([]);
  });

  it('drops byMonthday on a non-monthly rule', () => {
    const out = normalizeScheduleForFreq({ freq: RecurrenceFreq.WEEKLY, byWeekday: [1], byMonthday: 15 });
    expect(out.byMonthday).toBeNull();
  });

  it('keeps each field on its own frequency', () => {
    expect(
      normalizeScheduleForFreq({ freq: RecurrenceFreq.WEEKLY, byWeekday: [2], byMonthday: null }).byWeekday
    ).toEqual([2]);
    expect(normalizeScheduleForFreq({ freq: RecurrenceFreq.MONTHLY, byWeekday: [], byMonthday: 9 }).byMonthday).toBe(9);
  });
});
