/**
 * Google Calendar overlay types (E-052). Mirrors SPEC §3.16.
 *
 * Kept free of DOM and framework imports so it survives the E-033 shared-package
 * extraction unchanged.
 */

/**
 * Whether the overlay being rendered is complete.
 *
 * This exists because an empty event list is ambiguous: a user with no meetings
 * and a user whose token just died look identical, and the second must never be
 * shown a clean calendar. Always read this alongside the events.
 */
export type GoogleStatus = 'ok' | 'disconnected' | 'error';

/**
 * One Google event. Times arrive already converted to the user's timezone — do
 * NOT re-derive the local hour, which is what breaks across a DST boundary.
 *
 * When `allDay` is true, `start`/`end` are plain `YYYY-MM-DD` dates with no time
 * component. `end` is exclusive, matching Google.
 */
export interface IGoogleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  calendarId: string;
  htmlLink: string;
  /**
   * Detail fields are `omitempty` on the wire — an event without them omits the
   * key entirely, so every consumer must treat absent and empty as the same
   * thing rather than rendering an empty row.
   */
  location?: string;
  /** Already flattened from HTML and truncated server-side. Render as text. */
  description?: string;
  organizer?: string;
  attendeeCount?: number;
  /** The VIEWER's own RSVP — absent when the event has no attendee list. */
  responseStatus?: GoogleResponseStatus;
}

/** The viewer's RSVP. Mirrors Google's own vocabulary. */
export type GoogleResponseStatus = 'accepted' | 'declined' | 'tentative' | 'needsAction';

export interface GoogleEventsResponse {
  events: IGoogleEvent[];
  googleStatus: GoogleStatus;
}

export interface GetGoogleEventsRequest {
  /** Inclusive start date, `YYYY-MM-DD`. */
  from: string;
  /** Inclusive end date, `YYYY-MM-DD`. Span is capped at 62 days. */
  to: string;
  /** Bypass the server-side cache. */
  refresh?: boolean;
}

/** One calendar in the Settings picker. */
export interface IGoogleCalendar {
  id: string;
  summary: string;
  backgroundColor: string;
  primary: boolean;
  selected: boolean;
}

/** The stored connection. Carries no token in any form. */
export interface IGoogleConnection {
  googleAccountEmail: string;
  selectedCalendarIds: string[];
  scopes: string[];
  connectedAt: string;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface GoogleConnectResponse {
  authUrl: string;
}

/** Maximum calendars that may overlay at once — each is a separate API call. */
export const MAX_SELECTED_CALENDARS = 5;
