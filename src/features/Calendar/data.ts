/** Rendered height of one hour row. Every geometry number derives from this. */
export const HOUR_HEIGHT_PX = 48;

/**
 * Height a timed task is drawn at when it carries no estimate. RENDERED ONLY —
 * the grid never writes `estimatedMinutes` to make a block visible.
 */
export const DEFAULT_BLOCK_MINUTES = 30;

/**
 * Smallest duration any block is DRAWN at — tasks and Google events alike.
 *
 * Expressed in minutes rather than pixels so it means the same thing at every
 * row height: a px floor made a 15-minute block and a 30-minute block render
 * identically at 48px/hour, which had the grid stating a duration it was not
 * actually drawing. Anything shorter is still shown at this height so it stays
 * readable and tappable — the stored value is never touched.
 */
export const MIN_BLOCK_MINUTES = 30;

export const HOURS_PER_DAY = 24;

export const MINUTES_PER_DAY = HOURS_PER_DAY * 60;

/**
 * Every hour of the day. The grid renders a user-chosen slice of this rather
 * than the whole thing — see `visibleHourRange` — so this stays the full span
 * that geometry is measured against, not the span that is drawn.
 */
export const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);

export const CALENDAR_VIEWS = ['day', 'week', 'month'] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const DEFAULT_VIEW: CalendarView = 'week';

/**
 * Dots shown in a mobile month cell before it degrades to a "+". A ~50px cell
 * cannot hold more without wrapping, and the count already carries the number.
 */
export const MAX_DENSITY_DOTS = 3;

/** Padded month grid is always whole weeks, so rows stay rectangular. */
export const MONTH_GRID_DAYS = 42;

export const DAYS_PER_WEEK = 7;

/**
 * Chips a desktop month cell shows before collapsing the rest into "+N more".
 * Four would push a 6-week grid past a laptop viewport and turn the month into
 * a scroll, which defeats the at-a-glance read it exists for.
 */
export const MAX_MONTH_CHIPS = 3;

/**
 * Google event chips a desktop month cell shows before collapsing the rest
 * into "+N more". Kept smaller than the task cap — the user's own work stays
 * the primary read, Google is context underneath it.
 */
export const MAX_MONTH_GOOGLE_CHIPS = 2;

/**
 * Rows the all-day rail shows before collapsing behind "+N more".
 *
 * Uncapped, a single heavy day stretched the rail and pushed the hour grid —
 * the thing the view exists for — below the fold, while every lighter day sat
 * as whitespace beside it.
 */
export const MAX_ALL_DAY_ROWS = 2;

/** Server caps a range request at 62 days; every view here is far inside that. */
export const MAX_RANGE_DAYS = 62;

/**
 * Granularity every drag and resize snaps to. Matches the backend's stored
 * boundary, so a dragged value round-trips unchanged.
 */
export const SNAP_MINUTES = 15;

/**
 * Pointer travel before a mouse drag starts. Below this a gesture is a click
 * that opens the dialog, so a slightly shaky click never silently reschedules.
 */
export const DRAG_THRESHOLD_PX = 4;

/**
 * Hold time before a touch drag lifts. On a scrolling grid an immediate touch
 * drag would steal every vertical swipe, so touch must announce intent first.
 */
export const LONG_PRESS_MS = 350;

/** Hit area of the bottom-edge resize handle. */
export const RESIZE_HANDLE_PX = 10;
