import type { IGoogleCalendar } from '@/lib/store';

/**
 * Per-calendar colour for the Google overlay (NIC-1881).
 *
 * Colours come from Google's own `backgroundColor` so a calendar reads the same
 * hue here as it does in Google Calendar — a user who has trained themselves on
 * "work is blue, family is green" keeps that instinct instead of learning a
 * second mapping.
 *
 * Google's palette is tuned for a white calendar surface, so the raw hex is used
 * only as an ACCENT (a bar, a dot, a low-alpha fill) and never as a text colour
 * or a solid background. That keeps the overlay legible in dark mode without
 * needing to correct Google's colours, which would defeat the point of using
 * them.
 *
 * Pure and framework-free so it survives the E-033 shared-package extraction.
 */

/**
 * Fallback hues for a calendar that is not in the picker list — unshared,
 * deleted, or simply not loaded yet. Chosen to stay distinguishable on both
 * themes, so a colour that appears before the list resolves is a plausible
 * colour rather than a grey placeholder that visibly changes later.
 */
const FALLBACK_HUES = ['#4285f4', '#0b8043', '#f4511e', '#8e24aa', '#039be5', '#e4c441', '#c0392b'] as const;

/** Fully-opaque 6-digit hex, the only shape Google sends. */
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * Stable index for a calendar id.
 *
 * A hash rather than list position: positions shift when a calendar is added or
 * unshared, which would silently recolour every event on the grid. The id never
 * moves, so the fallback colour is stable for as long as the calendar exists.
 */
const hashIndex = (value: string, buckets: number): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % buckets;
};

/**
 * The accent hex for one calendar.
 *
 * Google's value is validated rather than trusted: a malformed string injected
 * straight into a style attribute would either break the rule silently or, with
 * a colour like `red;background:url(...)`, do something worse.
 */
export const calendarColor = (calendarId: string, calendars: IGoogleCalendar[]): string => {
  const fromGoogle = calendars.find(calendar => calendar.id === calendarId)?.backgroundColor;
  if (fromGoogle && HEX_COLOR.test(fromGoogle)) return fromGoogle;
  return FALLBACK_HUES[hashIndex(calendarId, FALLBACK_HUES.length)]!;
};

/**
 * `rgb(...)` channels for a hex, so callers can build `color-mix`-free alpha
 * variants that work in every browser the app supports.
 */
const channels = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** The same accent at a given alpha, for fills and borders. */
export const withAlpha = (hex: string, alpha: number): string => {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Inline style for one event chip.
 *
 * Returned as a style object rather than a class because the hue is data, not a
 * design token — there is no finite set of Tailwind classes that covers every
 * colour a user's calendars might carry.
 *
 * The fill is deliberately faint: the chip sits BEHIND the user's own task
 * blocks, and a saturated background would compete with the work it is meant to
 * provide context for.
 */
export interface ChipStyle {
  backgroundColor: string;
  borderColor: string;
  borderInlineStartColor: string;
}

export const chipStyle = (color: string): ChipStyle => ({
  backgroundColor: withAlpha(color, 0.1),
  borderColor: withAlpha(color, 0.28),
  // The leading edge carries the full-strength hue: it is the one part of the
  // chip small enough to saturate without overwhelming the text on top of it.
  borderInlineStartColor: color,
});
