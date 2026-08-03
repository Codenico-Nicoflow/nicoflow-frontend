import { type IGoogleCalendar, MAX_SELECTED_CALENDARS } from '@/lib/store';

/**
 * Pure selection rules for the Google calendar picker (NIC-1857).
 *
 * Kept free of React and DOM so the cap logic is testable on its own and
 * survives the E-033 shared-package extraction. The backend enforces the same
 * cap — this module exists to make the UI *explain* the limit, never to be the
 * thing that enforces it.
 */

/** IDs of the currently selected calendars, in list order. */
export const selectedIds = (calendars: IGoogleCalendar[]): string[] => calendars.filter(c => c.selected).map(c => c.id);

/**
 * Whether the cap has been reached.
 *
 * Uses `>=` rather than `===` so a selection that somehow exceeded the cap (a
 * second tab, a direct API call, a row predating the limit) still reads as full
 * instead of silently allowing more.
 */
export const isAtCap = (selected: string[]): boolean => selected.length >= MAX_SELECTED_CALENDARS;

/**
 * Whether a given calendar's checkbox should be disabled.
 *
 * Only *unselected* calendars lock at the cap. Un-checking must always stay
 * available, or a user who reaches the limit is trapped with no way back under
 * it — the classic cap-UI bug.
 */
export const isDisabledByCap = (calendar: IGoogleCalendar, selected: string[]): boolean =>
  !calendar.selected && isAtCap(selected);

/**
 * The next selection after toggling one calendar.
 *
 * Returns the current selection unchanged when the toggle would exceed the cap,
 * so a caller that ignores `isDisabledByCap` still cannot build an invalid
 * request. Pure — callers decide whether to persist the result.
 */
export const toggleCalendar = (calendars: IGoogleCalendar[], calendarId: string): string[] => {
  const selected = selectedIds(calendars);

  if (selected.includes(calendarId)) {
    return selected.filter(id => id !== calendarId);
  }
  if (isAtCap(selected)) {
    return selected;
  }
  return [...selected, calendarId];
};
