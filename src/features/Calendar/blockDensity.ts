/**
 * How much a drawn block can actually say (NIC-1892).
 *
 * A block's box is a function of duration and row height; the text inside it is
 * not. Two lines of 11–12px type plus padding and a border need ~44px however
 * tall an hour is, so the decision "can this box hold a second line?" is an
 * ABSOLUTE pixel question — never a share of the row.
 *
 * Getting that wrong is what clipped `08:00 · 15 min` through the middle of the
 * glyphs on every short block: a 15-minute task is floored to a 30-minute BOX,
 * but the content assumed both lines always fit. Text that is cut in half reads
 * as a rendering fault, not as a short task.
 *
 * Pure and framework-free so it survives the E-033 shared-package extraction.
 */

/**
 * Content height needed for a title line, a meta line, the 2px of vertical
 * padding either side and the 1px border. Measured against the rendered styles
 * rather than guessed: title is `text-xs`/16px line box, meta `text-[11px]`/14px.
 */
const TWO_LINE_MIN_PX = 44;

/** Below this even a single truncated line has nowhere to sit. */
const ONE_LINE_MIN_PX = 22;

/** What a block of a given drawn height is able to show. */
export interface BlockDensity {
  /** Render the time/duration line. */
  showMeta: boolean;
  /** Render the title. False only for a block too short for any text at all. */
  showTitle: boolean;
}

/**
 * Decide from the height the block is actually DRAWN at.
 *
 * Deliberately takes pixels rather than minutes: the same 15-minute task is
 * legible at a tall row height and not at a short one, and duration alone
 * cannot tell those apart.
 */
export const blockDensity = (heightPx: number): BlockDensity => ({
  showMeta: heightPx >= TWO_LINE_MIN_PX,
  showTitle: heightPx >= ONE_LINE_MIN_PX,
});
