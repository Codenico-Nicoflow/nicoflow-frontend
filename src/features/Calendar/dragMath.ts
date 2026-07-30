import { HOUR_HEIGHT_PX, MINUTES_PER_DAY, SNAP_MINUTES } from './data';

/** Pixels one snap step occupies — the smallest movement that changes anything. */
export const SNAP_HEIGHT_PX = (SNAP_MINUTES / 60) * HOUR_HEIGHT_PX;

/**
 * Round minutes to the nearest 15-minute boundary.
 *
 * Free-form minutes produce 09:07 blocks that no longer line up with the hour
 * rows, so the grid looks broken even though the data is correct. Snapping is
 * applied to the RESULT of a gesture, never to the stored value of a task the
 * user never dragged.
 */
export const snapMinutes = (minutes: number): number => Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

/** Vertical pixel delta as snapped minutes. */
export const deltaToMinutes = (deltaY: number): number => snapMinutes((deltaY / HOUR_HEIGHT_PX) * 60);

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
export const movedStartMinutes = (startMinutes: number, deltaY: number): number => {
  const moved = startMinutes + deltaToMinutes(deltaY);
  return Math.min(Math.max(moved, 0), MINUTES_PER_DAY - SNAP_MINUTES);
};

/**
 * Duration after a bottom-edge resize.
 *
 * Floored at one snap step so a block can never be dragged to zero (an
 * invisible, unclickable block), and capped at the remainder of the day for the
 * same cross-midnight reason as the move.
 */
export const resizedMinutes = (startMinutes: number, currentMinutes: number, deltaY: number): number => {
  const resized = snapMinutes(currentMinutes + deltaToMinutes(deltaY));
  return Math.min(Math.max(resized, SNAP_MINUTES), MINUTES_PER_DAY - startMinutes);
};
