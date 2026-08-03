import { HOURS_PER_DAY } from './data';

/**
 * Calendar display preferences (NIC-1890).
 *
 * Pure and framework-free so it survives the E-033 shared-package extraction.
 * The server is the source of truth (they live on `users`); everything here
 * only interprets what it sent, and defends against a value it did not.
 */

/** 0 = Sunday … 6 = Saturday, matching JS `getDay()` and Go `time.Weekday`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CalendarPrefs {
  weekStart: Weekday;
  workdays: Weekday[];
  /** First hour drawn, 0–23. */
  dayStartHour: number;
  /** Last hour drawn, EXCLUSIVE, 1–24. 24 means "through midnight". */
  dayEndHour: number;
}

/**
 * What the grid draws for a user who has never touched these settings.
 *
 * Matches the backend column defaults exactly. They are duplicated rather than
 * derived because the client must render something before the profile response
 * arrives, and a grid that draws a different week for one frame is worse than
 * one that agrees with the server from the start.
 */
export const DEFAULT_CALENDAR_PREFS: CalendarPrefs = {
  weekStart: 1,
  workdays: [0, 1, 2, 3, 4, 5, 6],
  dayStartHour: 0,
  dayEndHour: HOURS_PER_DAY,
};

/**
 * The shape as it arrives: plain numbers, any of which may be missing or out of
 * range. Deliberately looser than `CalendarPrefs` — narrowing to the safe type
 * is exactly what `resolveCalendarPrefs` is for.
 */
export interface RawCalendarPrefs {
  weekStart?: number;
  workdays?: number[];
  dayStartHour?: number;
  dayEndHour?: number;
}

const isWeekday = (value: number): value is Weekday => Number.isInteger(value) && value >= 0 && value <= 6;

/**
 * Normalise whatever the server sent into something safe to render.
 *
 * Every field falls back independently: a malformed `workdays` must not also
 * cost the user their hour window. The grid has no way to report a bad
 * preference, so silently drawing the default is the only honest option — the
 * alternative is a blank or broken calendar with no explanation.
 */
export const resolveCalendarPrefs = (prefs?: RawCalendarPrefs | null): CalendarPrefs => {
  if (!prefs) return DEFAULT_CALENDAR_PREFS;

  const workdays = (prefs.workdays ?? []).filter(isWeekday);
  const weekStart = prefs.weekStart;
  const start = prefs.dayStartHour;
  const end = prefs.dayEndHour;
  // Both bounds are checked together: an inverted or empty window is unusable
  // even when each end is individually in range.
  const windowOk =
    typeof start === 'number' &&
    typeof end === 'number' &&
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 0 &&
    end <= HOURS_PER_DAY &&
    start < end;

  return {
    weekStart: weekStart !== undefined && isWeekday(weekStart) ? weekStart : DEFAULT_CALENDAR_PREFS.weekStart,
    // An empty set would render a calendar with no days — a blank screen the
    // user cannot navigate out of.
    workdays: workdays.length > 0 ? workdays : DEFAULT_CALENDAR_PREFS.workdays,
    dayStartHour: windowOk ? start : DEFAULT_CALENDAR_PREFS.dayStartHour,
    dayEndHour: windowOk ? end : DEFAULT_CALENDAR_PREFS.dayEndHour,
  };
};

/** Whether a date falls on one of the user's chosen days. */
export const isWorkday = (date: Date, prefs: CalendarPrefs): boolean =>
  prefs.workdays.includes(date.getDay() as Weekday);

/**
 * The hours the grid renders, widened to include anything actually scheduled.
 *
 * The window is a DEFAULT VIEW, never a filter. A task at 06:00 under an 08:00
 * start must still appear: a display preference that silently hides scheduled
 * work reads as data loss, and the user has no way to tell the difference.
 *
 * `occupied` carries the minute bounds of everything drawn that day — tasks AND
 * Google events. Events are included deliberately: a meeting the user does not
 * control disappearing is exactly as bad as a task doing so.
 */
export const visibleHourRange = (
  prefs: CalendarPrefs,
  occupied: readonly [number, number][] = []
): [number, number] => {
  let start = prefs.dayStartHour;
  let end = prefs.dayEndHour;

  occupied.forEach(([from, to]) => {
    start = Math.min(start, Math.floor(from / 60));
    // The end is exclusive, so a block ending at 18:30 needs the 18:00 row —
    // hence ceil, and hence a block ending exactly at 18:00 does not widen.
    end = Math.max(end, Math.ceil(to / 60));
  });

  return [Math.max(0, start), Math.min(HOURS_PER_DAY, end)];
};

/** The hour labels to render for a window, e.g. 8…23 for `[8, 24]`. */
export const hoursIn = ([start, end]: [number, number]): number[] =>
  Array.from({ length: Math.max(end - start, 1) }, (_, offset) => start + offset);

/**
 * Row height for a window, in px.
 *
 * The point of narrowing the day is not only to remove empty night — it is to
 * spend that reclaimed vertical space on the hours that are left. At the base
 * 48px an hour, a 15-minute block is 12px and gets clamped up to the 24px
 * minimum, which means a quarter-hour task and a half-hour task render
 * identically: the grid states a duration it is not actually drawing. Taller
 * rows make the snap granularity honest.
 *
 * Capped so a one- or two-hour window does not turn a single task into a slab
 * the height of the viewport.
 */
export const hourHeightFor = (window: [number, number], baseHeight: number): number => {
  const hours = Math.max(window[1] - window[0], 1);
  // Scale by how much of the day was hidden, so a 24-hour window is unchanged
  // and an 8-hour one is three times as tall before the cap applies.
  const scaled = (baseHeight * HOURS_PER_DAY) / hours;
  return Math.round(Math.min(Math.max(scaled, baseHeight), baseHeight * MAX_HOUR_SCALE));
};

/**
 * How far a row may stretch. 2× puts a 15-minute block at 24px — the minimum
 * that reads as a real block rather than a hairline — without letting a short
 * window blow the grid up to one task per screen.
 */
const MAX_HOUR_SCALE = 2;
