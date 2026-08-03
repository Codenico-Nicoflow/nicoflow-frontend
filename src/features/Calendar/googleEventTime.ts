import type { IGoogleEvent } from '@/lib/store';

import { eventMinutes } from './googleOverlay';

/**
 * Time formatting for Google events (NIC-1881).
 *
 * Every function here slices the RFC3339 string rather than constructing a Date.
 * The server already converted to the user's account zone (SPEC §3.16), so
 * `new Date(...)` would re-interpret the value in the BROWSER's zone and shift
 * every displayed time for a traveller — the exact bug the server-side
 * conversion exists to prevent.
 */

const TIME_START = 11;
const TIME_END = 16;

/** `"09:00"` from an RFC3339 timestamp. */
export const eventTime = (timestamp: string): string => timestamp.slice(TIME_START, TIME_END);

/** `"09:00 – 09:30"`. */
export const eventRange = (event: IGoogleEvent): string => `${eventTime(event.start)} – ${eventTime(event.end)}`;

/**
 * Duration in whole minutes, or null when either boundary is unreadable.
 *
 * Multi-day events return the true span rather than the clipped one: the
 * popover describes the meeting, not the part of it that fits on today.
 */
export const eventDurationMinutes = (event: IGoogleEvent): number | null => {
  const start = eventMinutes(event.start);
  const end = eventMinutes(event.end);
  if (start === null || end === null) return null;

  const sameDay = event.start.slice(0, 10) === event.end.slice(0, 10);
  // An event crossing midnight wraps into the next day, so the raw difference
  // would be negative.
  return sameDay ? end - start : end - start + 24 * 60;
};

const MINUTES_PER_HOUR = 60;

/**
 * A duration split into hours and minutes for the i18n layer.
 *
 * Returns parts rather than a formatted string so the caller picks the plural
 * form — "1 hour 30 minutes" pluralises differently in Hebrew and Russian, and
 * assembling it here would hard-code English word order.
 */
export interface DurationParts {
  hours: number;
  minutes: number;
}

export const durationParts = (totalMinutes: number): DurationParts => ({
  hours: Math.floor(totalMinutes / MINUTES_PER_HOUR),
  minutes: totalMinutes % MINUTES_PER_HOUR,
});
