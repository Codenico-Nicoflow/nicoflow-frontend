import type { IGoogleEvent } from '@/lib/store';

import { HOUR_HEIGHT_PX, MINUTES_PER_DAY } from './data';

/**
 * Geometry for the Google event wash (NIC-1863).
 *
 * Nicoflow is a task app with calendar awareness, not a calendar client, so
 * Google events are context and never content. They render as full-width tinted
 * bands BEHIND task blocks.
 *
 * The standard overlay approach — splitting column width between events and
 * tasks — was rejected: it steals width from the user's own tasks, which is
 * backwards, and is fatal at 375px. Because the wash never negotiates width, a
 * late-arriving event cannot move a single task block. That is a geometric
 * guarantee, not a rendering convention.
 *
 * Pure and framework-free so it survives the E-033 shared-package extraction.
 */

/** A tinted band on one day column, in pixels from the top. */
export interface WashBand {
  /** Stable key for React — id alone can repeat across a multi-day event. */
  key: string;
  top: number;
  height: number;
  /**
   * How many events cover this band. Overlapping meetings deepen the tint
   * rather than splitting width, so being double-booked reads as "more solidly
   * busy" instead of "two narrower things".
   */
  depth: number;
}

/** Floor so a very short meeting stays visible rather than collapsing away. */
const MIN_BAND_HEIGHT_PX = 6;

/** Tint deepens up to this many overlapping events, then stops. */
export const MAX_WASH_DEPTH = 3;

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

/**
 * Bands for one day, split wherever the overlap depth changes.
 *
 * Built with a sweep over boundaries rather than one rectangle per event: two
 * meetings sharing an hour must render as one deeper band across the shared
 * region, not as two stacked translucent rectangles whose seams show through.
 */
export const washBands = (events: IGoogleEvent[], dayKey: string): WashBand[] => {
  const spans = timedEventsOn(events, dayKey)
    .map(event => spanWithinDay(event, dayKey))
    .filter((span): span is [number, number] => span !== null && span[1] > span[0]);

  if (spans.length === 0) return [];

  const boundaries = [...new Set(spans.flatMap(([start, end]) => [start, end]))].sort((a, b) => a - b);

  const bands: WashBand[] = [];
  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const from = boundaries[i]!;
    const to = boundaries[i + 1]!;
    const depth = spans.filter(([start, end]) => start <= from && end >= to).length;
    if (depth === 0) continue;

    const previous = bands.at(-1);
    // Merge equal-depth neighbours so a run of identical tint is one element,
    // not a stack of adjacent bands with visible seams.
    if (previous && previous.depth === depth && previous.top + previous.height >= (from / 60) * HOUR_HEIGHT_PX - 0.01) {
      previous.height = (to / 60) * HOUR_HEIGHT_PX - previous.top;
      continue;
    }

    bands.push({
      key: `${dayKey}-${from}-${to}`,
      top: (from / 60) * HOUR_HEIGHT_PX,
      height: Math.max(((to - from) / 60) * HOUR_HEIGHT_PX, MIN_BAND_HEIGHT_PX),
      depth,
    });
  }

  return bands;
};

/** Count of timed Google events on a day, for the day header. */
export const eventCountOn = (events: IGoogleEvent[], dayKey: string): number => timedEventsOn(events, dayKey).length;

/**
 * A drawn Google event chip: its extent, plus which lane it sits in when it
 * overlaps another event.
 */
export interface EventChip {
  event: IGoogleEvent;
  top: number;
  height: number;
  /** 0-based column among simultaneous events. */
  lane: number;
  /** How many lanes this chip's overlap group needs, so width can be derived. */
  lanes: number;
  /** True when the chip is too short to fit a title and a time on two lines. */
  isCompact: boolean;
}

/**
 * Below this a chip renders as a single line (title only) — two lines of text
 * in ~24px would clip mid-glyph, which reads as a rendering fault rather than a
 * short meeting.
 */
const COMPACT_CHIP_PX = 34;

/**
 * Chips for one day, laid out into lanes.
 *
 * Deliberately separate from `washBands`: bands are depth segments and a single
 * band can cover two meetings, so mapping band→event would label the wrong one.
 *
 * Lanes only ever subdivide the OVERLAY's own inset strip — never the day
 * column — so two simultaneous meetings narrow against each other and still
 * cannot take a pixel from a task block. That is what preserves the guarantee
 * that a late-arriving events response cannot reflow the user's own work.
 */
export const eventChips = (events: IGoogleEvent[], dayKey: string): EventChip[] => {
  const placed = timedEventsOn(events, dayKey)
    .map(event => {
      const span = spanWithinDay(event, dayKey);
      if (!span) return null;
      const [start, end] = span;
      return { event, start, end };
    })
    .filter((entry): entry is { event: IGoogleEvent; start: number; end: number } => entry !== null)
    // Earliest first, longest as the tie-break, so lane 0 is the day's spine and
    // lane assignment is stable rather than dependent on server ordering.
    .sort((a, b) => a.start - b.start || b.end - a.end);

  if (placed.length === 0) return [];

  // Lane per event: the first lane whose last event has already ended.
  const laneEnds: number[] = [];
  const lanes = placed.map(({ start, end }) => {
    const free = laneEnds.findIndex(laneEnd => laneEnd <= start);
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = end;
    return lane;
  });

  // One lane count for the whole day rather than per overlap cluster: a chip
  // that changed width partway down the column would read as a layout bug, and
  // the overlay strip is too narrow for the distinction to buy anything.
  const laneCount = laneEnds.length;

  return placed.map(({ event, start, end }, index) => {
    const height = Math.max(((end - start) / 60) * HOUR_HEIGHT_PX, MIN_BAND_HEIGHT_PX);
    return {
      event,
      top: (start / 60) * HOUR_HEIGHT_PX,
      height,
      lane: lanes[index]!,
      lanes: laneCount,
      isCompact: height < COMPACT_CHIP_PX,
    };
  });
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
