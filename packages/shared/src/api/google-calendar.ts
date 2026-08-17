import type { ApiEnvelope } from '@nicoflow/shared/types';
import { GOOGLE_CALENDAR_API } from '@nicoflow/shared/types';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiBaseQuery } from './area';
import type {
  GetGoogleEventsRequest,
  GoogleConnectResponse,
  GoogleEventsResponse,
  IGoogleCalendar,
  IGoogleConnection,
} from './google-calendar.types';

/**
 * Google Calendar overlay data layer (E-052).
 *
 * Three tags rather than one, because the three resources move independently:
 * changing the selection does not change the connection, and events change on
 * their own (Google's) schedule. Collapsing them would make a picker toggle
 * refetch the connection for no reason.
 *
 * `GoogleEvent` is deliberately a single-entry tag: events are fetched per date
 * range, and per-id tags would not help — a new range is a new query, not an
 * invalidation of an old one.
 */
export const createGoogleCalendarApi = (baseQuery: ApiBaseQuery) => {
  const googleCalendarApi = createApi({
    reducerPath: 'googleCalendarApi',
    baseQuery,
    tagTypes: ['GoogleConnection', 'GoogleCalendar', 'GoogleEvent'],
    endpoints: builder => ({
      getGoogleConnection: builder.query<IGoogleConnection, void>({
        query: () => GOOGLE_CALENDAR_API.CONNECTION,
        transformResponse: (raw: ApiEnvelope<IGoogleConnection>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: ['GoogleConnection'],
      }),

      getGoogleAuthUrl: builder.query<GoogleConnectResponse, string | void>({
        query: next => {
          const qs = next ? `?${new URLSearchParams({ next }).toString()}` : '';
          return `${GOOGLE_CALENDAR_API.CONNECT}${qs}`;
        },
        transformResponse: (raw: ApiEnvelope<GoogleConnectResponse>) => raw.data,
        transformErrorResponse: error => error.data,
      }),

      disconnectGoogle: builder.mutation<void, void>({
        query: () => ({ url: GOOGLE_CALENDAR_API.CONNECTION, method: 'DELETE' }),
        // Disconnecting invalidates everything: the calendars and the overlay are
        // both meaningless without a connection.
        invalidatesTags: ['GoogleConnection', 'GoogleCalendar', 'GoogleEvent'],
      }),

      getGoogleCalendars: builder.query<IGoogleCalendar[], void>({
        query: () => GOOGLE_CALENDAR_API.CALENDARS,
        transformResponse: (raw: ApiEnvelope<IGoogleCalendar[]>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: ['GoogleCalendar'],
      }),

      updateGoogleCalendarSelection: builder.mutation<IGoogleCalendar[], string[]>({
        query: calendarIds => ({
          url: GOOGLE_CALENDAR_API.CALENDARS,
          method: 'PUT',
          body: { calendarIds },
        }),
        transformResponse: (raw: ApiEnvelope<IGoogleCalendar[]>) => raw.data,
        transformErrorResponse: error => error.data,
        // The overlay must follow the selection — leaving 'GoogleEvent' valid here
        // would show the old calendars until the cache expired, which reads as a
        // broken picker. 'GoogleConnection' too, since selectedCalendarIds is part
        // of it.
        invalidatesTags: ['GoogleCalendar', 'GoogleConnection', 'GoogleEvent'],
      }),

      getGoogleEvents: builder.query<GoogleEventsResponse, GetGoogleEventsRequest>({
        query: ({ from, to, refresh }) => {
          const params = new URLSearchParams({ from, to });
          if (refresh) params.set('refresh', 'true');
          return `${GOOGLE_CALENDAR_API.EVENTS}?${params.toString()}`;
        },
        transformResponse: (raw: ApiEnvelope<GoogleEventsResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: ['GoogleEvent'],
      }),
    }),
  });

  return googleCalendarApi;
};
