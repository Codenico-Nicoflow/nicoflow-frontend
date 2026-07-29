/** Rendered height of one hour row. Every geometry number derives from this. */
export const HOUR_HEIGHT_PX = 48;

/**
 * Height a timed task is drawn at when it carries no estimate. RENDERED ONLY —
 * the grid never writes `estimatedMinutes` to make a block visible.
 */
export const DEFAULT_BLOCK_MINUTES = 30;

/** Floor so a short task stays tappable rather than collapsing to a hairline. */
export const MIN_BLOCK_HEIGHT_PX = 24;

export const MINUTES_PER_DAY = 24 * 60;

export const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** Views the route can render. Month arrives with NIC-1803. */
export const CALENDAR_VIEWS = ['day', 'week'] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const DEFAULT_VIEW: CalendarView = 'week';

/** Server caps a range request at 62 days; every view here is far inside that. */
export const MAX_RANGE_DAYS = 62;
