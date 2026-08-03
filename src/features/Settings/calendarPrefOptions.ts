import { HOURS_PER_DAY } from '@/features/Calendar/data';
import type { Weekday } from '@/features/Calendar/displayPrefs';

/**
 * Option lists for the calendar preferences card (NIC-1890).
 *
 * Split out so the card stays presentational and these stay trivially testable.
 */

/** Sunday … Saturday, in the 0–6 encoding shared with the backend. */
export const WEEKDAY_ORDER: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/**
 * Week starts offered.
 *
 * Only the two in real use: Sunday (Israel, North America) and Monday (most of
 * Europe, ISO 8601). Offering all seven would be technically supported by the
 * column but is noise — nobody's week begins on a Wednesday.
 */
export const WEEK_START_OPTIONS: Weekday[] = [0, 1];

/** Selectable hours for the day window. The end select appends 24 separately. */
export const HOUR_OPTIONS: number[] = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);

/**
 * The week rotated to begin on `weekStart`, so the workday toggles read in the
 * same order as the user's own calendar rather than always starting on Sunday.
 */
export const weekdaysFrom = (weekStart: Weekday): Weekday[] =>
  WEEKDAY_ORDER.map(offset => ((weekStart + offset) % WEEKDAY_ORDER.length) as Weekday);
