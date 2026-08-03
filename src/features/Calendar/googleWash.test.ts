import { describe, expect, it } from 'vitest';

import type { IGoogleEvent } from '@/lib/store';

import { HOUR_HEIGHT_PX } from './data';
import {
  allDayEventsOn,
  eventCountOn,
  eventDayKey,
  eventHitAreas,
  eventMinutes,
  hasConflict,
  timedEventsOn,
  washBands,
} from './googleWash';

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

describe('washBands', () => {
  it('places a band at the event position', () => {
    const [band] = washBands([timed('a', '09:00', '10:00')], DAY);

    expect(band!.top).toBe(9 * HOUR_HEIGHT_PX);
    expect(band!.height).toBe(HOUR_HEIGHT_PX);
    expect(band!.depth).toBe(1);
  });

  it('returns nothing for a day with no events', () => {
    expect(washBands([], DAY)).toEqual([]);
  });

  // Overlapping meetings deepen the tint rather than splitting width.
  it('deepens where events overlap', () => {
    const bands = washBands([timed('a', '09:00', '11:00'), timed('b', '10:00', '12:00')], DAY);

    const depths = bands.map(band => band.depth);
    expect(Math.max(...depths)).toBe(2);
    // 9–10 and 11–12 are single-depth; 10–11 is the shared region.
    expect(depths).toContain(1);
  });

  it('merges adjacent bands of equal depth into one', () => {
    // Back-to-back meetings are one continuous run of tint, not two bands.
    const bands = washBands([timed('a', '09:00', '10:00'), timed('b', '10:00', '11:00')], DAY);

    expect(bands).toHaveLength(1);
    expect(bands[0]!.height).toBe(2 * HOUR_HEIGHT_PX);
  });

  it('clips a multi-day event to the day being drawn', () => {
    const long = event('long', `${DAY}T22:00:00+03:00`, `2026-08-05T02:00:00+03:00`);
    const [band] = washBands([long], '2026-08-04');

    // A full middle day: midnight to midnight.
    expect(band!.top).toBe(0);
    expect(band!.height).toBe(24 * HOUR_HEIGHT_PX);
  });

  it('gives a zero-length event a visible minimum height', () => {
    const [band] = washBands([timed('a', '09:00', '09:01')], DAY);
    expect(band!.height).toBeGreaterThan(0);
  });
});

describe('eventHitAreas', () => {
  // Bands are depth segments and can cover two meetings, so a band→event
  // mapping would open the wrong one.
  it('returns one area per event, not per band', () => {
    const areas = eventHitAreas([timed('a', '09:00', '11:00'), timed('b', '10:00', '12:00')], DAY);

    expect(areas.map(area => area.event.id).sort()).toEqual(['a', 'b']);
  });

  it('paints a nested event after its container so it stays clickable', () => {
    const areas = eventHitAreas([timed('short', '10:00', '10:30'), timed('long', '09:00', '12:00')], DAY);

    expect(areas.at(-1)!.event.id).toBe('short');
  });

  it('positions an area at its own extent', () => {
    const [area] = eventHitAreas([timed('a', '09:00', '10:00')], DAY);

    expect(area!.top).toBe(9 * HOUR_HEIGHT_PX);
    expect(area!.height).toBe(HOUR_HEIGHT_PX);
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
