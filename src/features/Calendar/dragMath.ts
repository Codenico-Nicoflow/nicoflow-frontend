import { HOUR_HEIGHT_PX, MINUTES_PER_DAY, SNAP_MINUTES } from './data';

/** Pixels one snap step occupies at the base row height. */
export const SNAP_HEIGHT_PX = (SNAP_MINUTES / 60) * HOUR_HEIGHT_PX;

/**
 * Pixels one snap step occupies at a given row height.
 *
 * The row height varies with the visible-hours window (NIC-1890), and a drag
 * that converted screen pixels using the BASE height while the grid drew a
 * taller row would land every gesture at the wrong time. Every px↔minute
 * conversion therefore takes the height actually rendered.
 */
export const snapHeightAt = (hourHeight: number): number => (SNAP_MINUTES / 60) * hourHeight;

/**
 * Round minutes to the nearest 15-minute boundary.
 *
 * Free-form minutes produce 09:07 blocks that no longer line up with the hour
 * rows, so the grid looks broken even though the data is correct. Snapping is
 * applied to the RESULT of a gesture, never to the stored value of a task the
 * user never dragged.
 */
export const snapMinutes = (minutes: number): number => Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

/** Vertical pixel delta as snapped minutes, at the row height being drawn. */
export const deltaToMinutes = (deltaY: number, hourHeight: number = HOUR_HEIGHT_PX): number =>
  snapMinutes((deltaY / hourHeight) * 60);

/** "HH:MM" for minutes from midnight. Inverse of `parseMinutes`. */
export const toTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

/**
 * Start minute after a move gesture.
 *
 * Clamped into the day at both ends: a block dragged off the top lands at
 * 00:00, and one dragged off the bottom stops at the last snap boundary that
 * still leaves it inside the day. Cross-midnight is not a valid position — the
 * backend rejects it and every day-keyed path (sweeps, recurrence dedupe,
 * grouping) assumes a block belongs to exactly one date.
 */
export const movedStartMinutes = (
  startMinutes: number,
  deltaY: number,
  hourHeight: number = HOUR_HEIGHT_PX
): number => {
  const moved = startMinutes + deltaToMinutes(deltaY, hourHeight);
  return Math.min(Math.max(moved, 0), MINUTES_PER_DAY - SNAP_MINUTES);
};

/**
 * Duration after a bottom-edge resize.
 *
 * Floored at one snap step so a block can never be dragged to zero (an
 * invisible, unclickable block), and capped at the remainder of the day for the
 * same cross-midnight reason as the move.
 */
export const resizedMinutes = (
  startMinutes: number,
  currentMinutes: number,
  deltaY: number,
  hourHeight: number = HOUR_HEIGHT_PX
): number => {
  const resized = snapMinutes(currentMinutes + deltaToMinutes(deltaY, hourHeight));
  return Math.min(Math.max(resized, SNAP_MINUTES), MINUTES_PER_DAY - startMinutes);
};
