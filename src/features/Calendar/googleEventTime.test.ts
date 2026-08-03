import { describe, expect, it } from 'vitest';

import type { IGoogleEvent } from '@/lib/store';

import { durationParts, eventDurationMinutes, eventRange, eventTime } from './googleEventTime';

const timed = (start: string, end: string): IGoogleEvent => ({
  id: 'evt',
  title: 'Standup',
  start,
  end,
  allDay: false,
  calendarId: 'primary',
  htmlLink: 'https://calendar.google.com/evt',
});

describe('eventTime', () => {
  it('reads the wall clock the server already converted', () => {
    expect(eventTime('2026-08-03T09:05:00+03:00')).toBe('09:05');
  });

  // Constructing a Date would re-interpret this in the browser's zone and show
  // a different hour for a traveller.
  it('ignores the offset rather than reconverting', () => {
    expect(eventTime('2026-08-03T09:00:00-07:00')).toBe('09:00');
  });
});

describe('eventRange', () => {
  it('renders start and end', () => {
    expect(eventRange(timed('2026-08-03T09:00:00Z', '2026-08-03T09:30:00Z'))).toBe('09:00 – 09:30');
  });
});

describe('eventDurationMinutes', () => {
  it('measures a same-day event', () => {
    expect(eventDurationMinutes(timed('2026-08-03T09:00:00Z', '2026-08-03T10:30:00Z'))).toBe(90);
  });

  it('measures an event that crosses midnight', () => {
    expect(eventDurationMinutes(timed('2026-08-03T23:00:00Z', '2026-08-04T01:00:00Z'))).toBe(120);
  });

  it('returns null when a boundary is unreadable', () => {
    expect(eventDurationMinutes(timed('not-a-timestamp', '2026-08-03T10:00:00Z'))).toBeNull();
  });
});

describe('durationParts', () => {
  it.each([
    [30, { hours: 0, minutes: 30 }],
    [90, { hours: 1, minutes: 30 }],
    [120, { hours: 2, minutes: 0 }],
  ])('splits %i minutes for the i18n layer', (total, expected) => {
    expect(durationParts(total)).toEqual(expected);
  });
});
