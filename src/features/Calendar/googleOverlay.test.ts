import { describe, expect, it } from 'vitest';

import type { IGoogleEvent } from '@/lib/store';

import { HOUR_HEIGHT_PX } from './data';
import {
  allDayEventsOn,
  eventChips,
  eventCountOn,
  eventDayKey,
  eventMinutes,
  hasConflict,
  timedEventsOn,
} from './googleOverlay';

const DAY = '2026-08-03';

const event = (id: string, start: string, end: string, allDay = false): IGoogleEvent => ({
  id,
  title: id,
  start,
  end,
  allDay,
  calendarId: 'primary',
  htmlLink: `https://calendar.google.com/${id}`,
});

/** A timed event on DAY, given "HH:MM" bounds in the user's zone. */
const timed = (id: string, from: string, to: string) => event(id, `${DAY}T${from}:00+03:00`, `${DAY}T${to}:00+03:00`);

describe('eventMinutes', () => {
  it('reads the wall clock as sent, ignoring the offset', () => {
    // The server already converted to the user's zone; re-interpreting via Date
    // would shift this by the browser's offset.
    expect(eventMinutes('2026-08-03T09:30:00+03:00')).toBe(9 * 60 + 30);
    expect(eventMinutes('2026-08-03T09:30:00Z')).toBe(9 * 60 + 30);
  });

  it('returns null for a malformed or all-day value', () => {
    expect(eventMinutes('2026-08-03')).toBeNull();
    expect(eventMinutes('nonsense')).toBeNull();
    expect(eventMinutes('2026-08-03T99:00:00Z')).toBeNull();
  });
});

describe('eventDayKey', () => {
  it('takes the date portion', () => {
    expect(eventDayKey('2026-08-03T09:00:00+03:00')).toBe('2026-08-03');
    expect(eventDayKey('2026-08-03')).toBe('2026-08-03');
  });
});

describe('timedEventsOn', () => {
  it('keeps timed events on the day', () => {
    expect(timedEventsOn([timed('a', '09:00', '10:00')], DAY)).toHaveLength(1);
  });

  it('excludes all-day events — they belong to the rail', () => {
    expect(timedEventsOn([event('b', DAY, '2026-08-04', true)], DAY)).toHaveLength(0);
  });

  it('excludes events on other days', () => {
    expect(timedEventsOn([timed('a', '09:00', '10:00')], '2026-08-04')).toHaveLength(0);
  });

  // An evening meeting must not paint a band on tomorrow.
  it('does not carry an event ending exactly at midnight into the next day', () => {
    const overnight = event('late', `${DAY}T22:00:00+03:00`, `2026-08-04T00:00:00+03:00`);
    expect(timedEventsOn([overnight], DAY)).toHaveLength(1);
    expect(timedEventsOn([overnight], '2026-08-04')).toHaveLength(0);
  });

  it('includes a multi-day event on its middle day', () => {
    const long = event('long', `${DAY}T22:00:00+03:00`, `2026-08-05T02:00:00+03:00`);
    expect(timedEventsOn([long], '2026-08-04')).toHaveLength(1);
  });
});

describe('allDayEventsOn', () => {
  it('covers the start day', () => {
    expect(allDayEventsOn([event('b', DAY, '2026-08-04', true)], DAY)).toHaveLength(1);
  });

  // `end` is exclusive, matching Google.
  it('excludes the end day', () => {
    expect(allDayEventsOn([event('b', DAY, '2026-08-04', true)], '2026-08-04')).toHaveLength(0);
  });

  it('covers a middle day of a multi-day event', () => {
    expect(allDayEventsOn([event('b', DAY, '2026-08-06', true)], '2026-08-04')).toHaveLength(1);
  });
});

describe('eventChips', () => {
  it('returns nothing for a day with no events', () => {
    expect(eventChips([], DAY)).toEqual([]);
  });

  it('positions a chip at its own extent', () => {
    const [chip] = eventChips([timed('a', '09:00', '10:00')], DAY);

    expect(chip!.top).toBe(9 * HOUR_HEIGHT_PX);
    expect(chip!.height).toBe(HOUR_HEIGHT_PX);
  });

  // The whole reason the layout mirrors layoutDay: a lone meeting has no reason
  // to look narrower than a lone task.
  it('gives a lone event the full column', () => {
    const [chip] = eventChips([timed('a', '09:00', '10:00')], DAY);

    expect(chip!.column).toBe(0);
    expect(chip!.columns).toBe(1);
  });

  it('keeps sequential events at full width', () => {
    const chips = eventChips([timed('a', '09:00', '10:00'), timed('b', '10:00', '11:00')], DAY);

    expect(chips.every(chip => chip.columns === 1)).toBe(true);
  });

  it('splits width only between events that overlap', () => {
    const chips = eventChips([timed('a', '09:00', '11:00'), timed('b', '10:00', '12:00')], DAY);

    expect(chips.map(chip => chip.column)).toEqual([0, 1]);
    expect(chips.every(chip => chip.columns === 2)).toBe(true);
  });

  // An overlap early in the day must not narrow an unrelated meeting hours later.
  it('scopes the divisor to the overlap cluster, not the whole day', () => {
    const chips = eventChips(
      [timed('a', '09:00', '11:00'), timed('b', '10:00', '12:00'), timed('c', '15:00', '16:00')],
      DAY
    );

    expect(chips.find(chip => chip.event.id === 'c')!.columns).toBe(1);
  });

  it('assigns columns by start time, not by server order', () => {
    const chips = eventChips([timed('late', '10:00', '12:00'), timed('early', '09:00', '11:00')], DAY);

    expect(chips.map(chip => chip.event.id)).toEqual(['early', 'late']);
    expect(chips.map(chip => chip.column)).toEqual([0, 1]);
  });

  it('reuses a freed column once its event has ended', () => {
    const chips = eventChips(
      [timed('a', '09:00', '11:00'), timed('b', '10:00', '12:00'), timed('c', '11:00', '12:00')],
      DAY
    );

    // `c` starts as `a` ends, so it takes column 0 back rather than opening a third.
    expect(chips.find(chip => chip.event.id === 'c')!.column).toBe(0);
    expect(chips.every(chip => chip.columns === 2)).toBe(true);
  });

  it('clips a multi-day event to the day being drawn', () => {
    const long = event('long', `${DAY}T22:00:00+03:00`, `2026-08-05T02:00:00+03:00`);
    const [chip] = eventChips([long], '2026-08-04');

    // A full middle day: midnight to midnight.
    expect(chip!.top).toBe(0);
    expect(chip!.height).toBe(24 * HOUR_HEIGHT_PX);
  });

  // The events give up the width, never the task — a chip drawn at full width
  // under a task block is hidden by it and reads as a stray sliver.
  it('yields a column to a task that overlaps the event', () => {
    const [chip] = eventChips([timed('a', '09:00', '10:00')], DAY, [[9 * 60, 10 * 60]]);

    expect(chip!.column).toBe(1);
    expect(chip!.columns).toBe(2);
  });

  it('keeps the full column when the task does not overlap', () => {
    const [chip] = eventChips([timed('a', '09:00', '10:00')], DAY, [[14 * 60, 15 * 60]]);

    expect(chip!.column).toBe(0);
    expect(chip!.columns).toBe(1);
  });

  it('yields one column to a stack of two overlapping tasks', () => {
    const [chip] = eventChips([timed('a', '09:00', '10:00')], DAY, [
      [9 * 60, 10 * 60],
      [9 * 30, 10 * 60],
    ]);

    expect(chip!.column).toBe(2);
    expect(chip!.columns).toBe(3);
  });

  // Three tasks spread across the hour occupy one column between them, so
  // charging the event three would shrink it for a conflict that never existed.
  it('charges the deepest task stack, not the task count', () => {
    const [chip] = eventChips([timed('a', '09:00', '12:00')], DAY, [
      [9 * 60, 10 * 60],
      [10 * 60, 11 * 60],
      [11 * 60, 12 * 60],
    ]);

    expect(chip!.columns).toBe(2);
  });

  it('shares the remaining width between a task and two overlapping events', () => {
    const chips = eventChips([timed('a', '09:00', '11:00'), timed('b', '10:00', '12:00')], DAY, [[9 * 60, 12 * 60]]);

    expect(chips.map(chip => chip.column)).toEqual([1, 2]);
    expect(chips.every(chip => chip.columns === 3)).toBe(true);
  });

  it('marks a short event compact so its label does not clip', () => {
    const [short] = eventChips([timed('a', '09:00', '09:15')], DAY);
    const [long] = eventChips([timed('b', '09:00', '10:00')], DAY);

    expect(short!.isCompact).toBe(true);
    expect(long!.isCompact).toBe(false);
  });

  it('gives a zero-length event a visible minimum height', () => {
    const [chip] = eventChips([timed('a', '09:00', '09:01')], DAY);
    expect(chip!.height).toBeGreaterThan(0);
  });
});

describe('eventCountOn', () => {
  it('counts only timed events', () => {
    const events = [timed('a', '09:00', '10:00'), timed('b', '11:00', '12:00'), event('c', DAY, '2026-08-04', true)];
    expect(eventCountOn(events, DAY)).toBe(2);
  });
});

describe('hasConflict', () => {
  const events = [timed('meeting', '10:00', '11:00')];

  it('flags a task overlapping an event', () => {
    expect(hasConflict(events, DAY, 10 * 60 + 30, 11 * 60)).toBe(true);
  });

  it('flags a task fully containing an event', () => {
    expect(hasConflict(events, DAY, 9 * 60, 12 * 60)).toBe(true);
  });

  // Back-to-back is not double-booked.
  it('does not flag a task starting exactly when the event ends', () => {
    expect(hasConflict(events, DAY, 11 * 60, 12 * 60)).toBe(false);
  });

  it('does not flag a task ending exactly when the event starts', () => {
    expect(hasConflict(events, DAY, 9 * 60, 10 * 60)).toBe(false);
  });

  it('does not flag a task on a day with no events', () => {
    expect(hasConflict(events, '2026-08-04', 10 * 60, 11 * 60)).toBe(false);
  });

  it('does not flag against an all-day event', () => {
    expect(hasConflict([event('holiday', DAY, '2026-08-04', true)], DAY, 10 * 60, 11 * 60)).toBe(false);
  });
});
