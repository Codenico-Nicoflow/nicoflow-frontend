import type { IGoogleEvent } from '@/lib/store';

import { HOUR_HEIGHT_PX, MIN_BLOCK_MINUTES, MINUTES_PER_DAY } from './data';

/**
 * Geometry for the Google event overlay (NIC-1863, reshaped NIC-1881).
 *
 * Nicoflow is a task app with calendar awareness, not a calendar client, so
 * Google events are context and never content. They render as chips BEHIND task
 * blocks, in their own absolutely-positioned layer.
 *
 * Events size themselves the way tasks do — full column when nothing shares
 * their minutes — because two layers that measure width differently read as two
 * grids stacked on each other rather than one calendar. Where a task does share
 * those minutes, the EVENT is what narrows: the layer is out of flow, so a
 * late-arriving events response still cannot move a single task block. That
 * stays a geometric guarantee rather than a rendering convention.
 *
 * Pure and framework-free so it survives the E-033 shared-package extraction.
 */

const DAY_KEY_LENGTH = 10;

/** The `YYYY-MM-DD` an event's timestamp falls on, in the zone it arrived in. */
export const eventDayKey = (timestamp: string): string => timestamp.slice(0, DAY_KEY_LENGTH);

/**
 * Minutes from midnight for an event boundary.
 *
 * Reads the wall clock out of the RFC3339 string rather than constructing a
 * Date. The server already converted to the user's timezone (SPEC §3.16), so
 * `new Date(...)` would re-interpret it in the *browser's* zone and shift every
 * block for a traveller — the exact bug the server-side conversion exists to
 * prevent.
 */
export const eventMinutes = (timestamp: string): number | null => {
  const match = /T(\d{2}):(\d{2})/.exec(timestamp);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

/** Timed events overlapping one day, all-day ones excluded (they use the rail). */
export const timedEventsOn = (events: IGoogleEvent[], dayKey: string): IGoogleEvent[] =>
  events.filter(event => !event.allDay && overlapsDay(event, dayKey));

/** All-day events covering a day. `end` is exclusive, matching Google. */
export const allDayEventsOn = (events: IGoogleEvent[], dayKey: string): IGoogleEvent[] =>
  events.filter(event => event.allDay && dayKey >= event.start && dayKey < event.end);

const overlapsDay = (event: IGoogleEvent, dayKey: string): boolean => {
  const startDay = eventDayKey(event.start);
  const endDay = eventDayKey(event.end);
  // An event ending exactly at midnight belongs to the day it started, not the
  // next one — otherwise every evening meeting paints a band on tomorrow.
  const endsAtMidnight = eventMinutes(event.end) === 0;
  return dayKey >= startDay && (dayKey < endDay || (dayKey === endDay && !endsAtMidnight));
};

/** Clamped [start, end) minute span of an event within one day. */
const spanWithinDay = (event: IGoogleEvent, dayKey: string): [number, number] | null => {
  const startsToday = eventDayKey(event.start) === dayKey;
  const endsToday = eventDayKey(event.end) === dayKey;

  // A multi-day event is clipped to this day's bounds so it paints the whole
  // column rather than nothing.
  const start = startsToday ? eventMinutes(event.start) : 0;
  const end = endsToday ? eventMinutes(event.end) : MINUTES_PER_DAY;
  if (start === null || end === null) return null;

  const clampedStart = Math.max(0, Math.min(start, MINUTES_PER_DAY));
  const clampedEnd = Math.max(clampedStart, Math.min(end, MINUTES_PER_DAY));
  return [clampedStart, clampedEnd];
};

/** Count of timed Google events on a day, for the day header. */
export const eventCountOn = (events: IGoogleEvent[], dayKey: string): number => timedEventsOn(events, dayKey).length;

/**
 * A drawn Google event chip: its extent, plus the horizontal share it takes
 * when a task or another event shares its minutes.
 */
export interface EventChip {
  event: IGoogleEvent;
  top: number;
  height: number;
  /** 0-based slot, counted after any columns the overlapping tasks reserved. */
  column: number;
  /** Slots this cluster needs in total, tasks included. */
  columns: number;
  /** True when the chip is too short to fit a title and a time on two lines. */
  isCompact: boolean;
}

/**
 * Below this a chip renders as a single line (title only) — two lines of text
 * in ~24px would clip mid-glyph, which reads as a rendering fault rather than a
 * short meeting.
 */
const COMPACT_CHIP_PX = 34;

/** A [start, end) minute span a task occupies, for sharing width with events. */
export type TaskSpan = [number, number];

/**
 * Chips for one day, sharing column width with the task blocks above them.
 *
 * A lone event takes the FULL column, exactly as a lone task does. Width is
 * given up only where something genuinely competes for the same minutes — and
 * that "something" includes the user's TASKS, not just other events. Two earlier
 * shapes were both wrong for the same underlying reason:
 *
 * - a fixed-width strip made every event look permanently half-width, even on a
 *   completely empty day where nothing was competing for the space;
 * - full width regardless of tasks put the chip exactly beneath the task block,
 *   where the task covers it and the event reads as a stray sliver.
 *
 * So tasks reserve the leading columns of any cluster they touch and events fill
 * the ones after. The task layer is never consulted for its own layout — it is
 * read here only to decide how much room the EVENTS may take. Chips remain in an
 * absolutely-positioned layer beneath the blocks, so a late-arriving events
 * response still cannot move a single task.
 */
export const eventChips = (
  events: IGoogleEvent[],
  dayKey: string,
  taskSpans: TaskSpan[] = [],
  hourHeight: number = HOUR_HEIGHT_PX
): EventChip[] => {
  const placed = timedEventsOn(events, dayKey)
    .map(event => {
      const span = spanWithinDay(event, dayKey);
      if (!span) return null;
      const [start, end] = span;
      return { event, start, end };
    })
    .filter((entry): entry is { event: IGoogleEvent; start: number; end: number } => entry !== null)
    // Earliest first, longest as the tie-break, so column assignment is stable
    // rather than dependent on server ordering.
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const out: EventChip[] = [];
  let cluster: { chip: EventChip; end: number }[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const eventColumns = cluster.reduce((max, entry) => Math.max(max, entry.chip.column + 1), 1);
    // How many task columns this cluster's minutes have to yield to. Measured
    // across the cluster's whole extent so every chip in it is drawn against the
    // same divisor and their leading edges line up.
    const from = Math.min(...cluster.map(entry => entry.chip.top));
    const to = Math.max(...cluster.map(entry => entry.chip.top + entry.chip.height));
    const reserved = taskColumnsIn(taskSpans, (from / hourHeight) * 60, (to / hourHeight) * 60);

    const columns = eventColumns + reserved;
    cluster.forEach(({ chip }) => out.push({ ...chip, column: chip.column + reserved, columns }));
    cluster = [];
    clusterEnd = -1;
  };

  placed.forEach(({ event, start, end }) => {
    if (start >= clusterEnd && cluster.length > 0) flush();

    // First free slot: reuse a column whose occupant has already ended.
    const taken = new Set(cluster.filter(entry => entry.end > start).map(entry => entry.chip.column));
    let column = 0;
    while (taken.has(column)) column += 1;

    // The same 30-minute floor the task blocks use: a 15-minute meeting and a
    // 15-minute task must not be drawn at two different sizes on one grid.
    const height = Math.max(((end - start) / 60) * hourHeight, (MIN_BLOCK_MINUTES / 60) * hourHeight);
    cluster.push({
      chip: {
        event,
        top: (start / 60) * hourHeight,
        height,
        column,
        columns: 1,
        // Scaled with the row height: at a taller row a 15-minute chip has the
        // space for two lines that it did not have at 48px.
        isCompact: height < (COMPACT_CHIP_PX / HOUR_HEIGHT_PX) * hourHeight,
      },
      end,
    });
    clusterEnd = Math.max(clusterEnd, end);
  });

  if (cluster.length > 0) flush();
  return out;
};

/**
 * Widest stack of tasks anywhere inside [from, to) — the number of columns the
 * events in that window must leave alone.
 *
 * The maximum over the window rather than a total count: three tasks spread
 * across an hour occupy one column, and charging the events three would shrink
 * them to nothing for a conflict that never existed.
 */
const taskColumnsIn = (spans: TaskSpan[], from: number, to: number): number => {
  const overlapping = spans.filter(([start, end]) => start < to && end > from);
  if (overlapping.length === 0) return 0;

  // Sweep the overlapping tasks' own boundaries; the deepest point is the stack.
  return Math.max(...overlapping.map(([at]) => overlapping.filter(([start, end]) => start <= at && end > at).length));
};

/**
 * Whether a task block overlaps any Google event, for the conflict accent.
 *
 * Takes the task's own drawn extent in minutes, so the caller stays the single
 * source of truth for how tall a block is — duplicating that here would let the
 * accent drift from the geometry it describes.
 */
export const hasConflict = (events: IGoogleEvent[], dayKey: string, taskStart: number, taskEnd: number): boolean =>
  timedEventsOn(events, dayKey).some(event => {
    const span = spanWithinDay(event, dayKey);
    if (!span) return false;
    const [start, end] = span;
    // Touching edges is not a conflict: a meeting ending at 10:00 and a task
    // starting at 10:00 are back to back, not double-booked.
    return start < taskEnd && end > taskStart;
  });
