import type { Meta, StoryObj } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';

import type { IGoogleCalendar, IGoogleConnection } from '@/lib/store';
import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import { GoogleConnectionCard } from './GoogleConnectionCard';

const API = 'http://localhost:8080/v1';
const CONNECTION_URL = `${API}/calendar/google/connection`;
const CALENDARS_URL = `${API}/calendar/google/calendars`;

const connection: IGoogleConnection = {
  googleAccountEmail: 'user@example.com',
  selectedCalendarIds: ['primary'],
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  connectedAt: '2026-08-01T09:00:00Z',
  lastSyncAt: '2026-08-03T08:55:00Z',
  lastError: null,
};

const calendars: IGoogleCalendar[] = [
  { id: 'primary', summary: 'Personal', backgroundColor: '#4285f4', primary: true, selected: true },
  { id: 'team@example.com', summary: 'Team', backgroundColor: '#0b8043', primary: false, selected: false },
  { id: 'holidays@example.com', summary: 'Holidays', backgroundColor: '#f6bf26', primary: false, selected: false },
];

const connectionHandler = (value: IGoogleConnection | null, { hang = false } = {}) =>
  http.get(CONNECTION_URL, async () => {
    if (hang) await delay(1_000_000);
    if (!value) {
      return HttpResponse.json(
        { data: null, error: { code: 'GOOGLE_NOT_CONNECTED', message: 'not connected' } },
        { status: 409 }
      );
    }
    return HttpResponse.json({ data: value, error: null });
  });

const calendarsHandler = http.get(CALENDARS_URL, () => HttpResponse.json({ data: calendars, error: null }));

const meta: Meta<typeof GoogleConnectionCard> = {
  title: 'Features/Settings/GoogleConnectionCard',
  component: GoogleConnectionCard,
  decorators: [
    withStoryProviders,
    Story => (
      <div className="mx-auto max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GoogleConnectionCard>;

/** Connected: the account email, a disconnect control, and the calendar picker. */
export const Connected: Story = {
  parameters: { msw: { handlers: [connectionHandler(connection), calendarsHandler] } },
};

/** Nothing connected yet — a single call to action. */
export const NotConnected: Story = {
  parameters: { msw: { handlers: [connectionHandler(null), calendarsHandler] } },
};

export const Loading: Story = {
  parameters: { msw: { handlers: [connectionHandler(null, { hang: true })] } },
};

/**
 * A recorded sync failure is surfaced here rather than left to be discovered as
 * silently missing meetings.
 */
export const WithSyncFailure: Story = {
  parameters: {
    msw: {
      handlers: [
        connectionHandler({ ...connection, lastError: 'Google Calendar could not be reached' }),
        calendarsHandler,
      ],
    },
  },
};
