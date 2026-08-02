import { describe, expect, it } from 'vitest';

import { detectTimezoneDrift, formatZoneOffset, zoneOffsetMinutes } from './timezoneDrift';

// Mid-summer, so northern-hemisphere DST is active and the offsets below are
// the ones a real user would be on.
const SUMMER = new Date('2026-07-15T12:00:00Z');
// Mid-winter, to prove the comparison follows DST rather than a fixed table.
const WINTER = new Date('2026-01-15T12:00:00Z');

describe('zoneOffsetMinutes', () => {
  it.each([
    ['UTC', SUMMER, 0],
    ['Europe/London', SUMMER, 60],
    ['Europe/Paris', SUMMER, 120],
    ['Asia/Jerusalem', SUMMER, 180],
    ['Asia/Kolkata', SUMMER, 330],
    ['America/New_York', SUMMER, -240],
    ['Europe/London', WINTER, 0],
    ['America/New_York', WINTER, -300],
  ])('resolves %s to the right offset', (zone, at, expected) => {
    expect(zoneOffsetMinutes(zone, at)).toBe(expected);
  });

  it('returns null for a zone Intl rejects', () => {
    expect(zoneOffsetMinutes('Mars/Olympus_Mons', SUMMER)).toBeNull();
  });
});

describe('detectTimezoneDrift', () => {
  it('reports drift when the offsets differ', () => {
    expect(detectTimezoneDrift('Asia/Jerusalem', 'America/New_York', SUMMER)).toEqual({
      accountZone: 'Asia/Jerusalem',
      browserZone: 'America/New_York',
    });
  });

  it('reports nothing when the zone names are identical', () => {
    expect(detectTimezoneDrift('Europe/Paris', 'Europe/Paris', SUMMER)).toBeNull();
  });

  it('reports nothing for different names showing the same wall clock', () => {
    // Berlin and Paris are different strings but the identical clock — prompting
    // here would be noise that trains the user to dismiss reflexively.
    expect(detectTimezoneDrift('Europe/Berlin', 'Europe/Paris', SUMMER)).toBeNull();
  });

  it('reports drift once DST separates two zones that otherwise match', () => {
    // London and UTC are the same clock in January, an hour apart in July.
    expect(detectTimezoneDrift('UTC', 'Europe/London', WINTER)).toBeNull();
    expect(detectTimezoneDrift('UTC', 'Europe/London', SUMMER)).toEqual({
      accountZone: 'UTC',
      browserZone: 'Europe/London',
    });
  });

  it.each([
    ['a missing account zone', undefined, 'Europe/Paris'],
    ['an empty account zone', '', 'Europe/Paris'],
    ['a missing browser zone', 'Europe/Paris', undefined],
    ['an unresolvable account zone', 'Mars/Olympus_Mons', 'Europe/Paris'],
    ['an unresolvable browser zone', 'Europe/Paris', 'Mars/Olympus_Mons'],
  ])('reports nothing for %s', (_label, accountZone, browserZone) => {
    expect(detectTimezoneDrift(accountZone, browserZone, SUMMER)).toBeNull();
  });
});

describe('formatZoneOffset', () => {
  it.each([
    ['UTC', 'UTC+00:00'],
    ['Europe/Paris', 'UTC+02:00'],
    ['Asia/Kolkata', 'UTC+05:30'],
    ['America/New_York', 'UTC-04:00'],
  ])('labels %s as %s', (zone, expected) => {
    expect(formatZoneOffset(zone, SUMMER)).toBe(expected);
  });

  it('returns null for a zone Intl rejects', () => {
    expect(formatZoneOffset('Mars/Olympus_Mons', SUMMER)).toBeNull();
  });
});
