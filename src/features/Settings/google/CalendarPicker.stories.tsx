import type { Meta, StoryObj } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';

import { type IGoogleCalendar, MAX_SELECTED_CALENDARS } from '@/lib/store';
import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import { CalendarPicker } from './CalendarPicker';

const API = 'http://localhost:8080/v1';
const CALENDARS_URL = `${API}/calendar/google/calendars`;

const calendar = (id: string, summary: string, backgroundColor: string, selected: boolean): IGoogleCalendar => ({
  id,
  summary,
  backgroundColor,
  primary: id === 'primary',
  selected,
});

const listHandler = (calendars: IGoogleCalendar[], { hang = false, fail = false } = {}) =>
  http.get(CALENDARS_URL, async () => {
    if (hang) await delay(1_000_000);
    if (fail) {
      return HttpResponse.json(
        { data: null, error: { code: 'GOOGLE_AUTH_FAILED', message: 'unreachable' } },
        { status: 502 }
      );
    }
    return HttpResponse.json({ data: calendars, error: null });
  });

// Echoes the requested selection back so toggling in the story behaves like the
// real endpoint, which returns the updated list.
const putHandler = (calendars: IGoogleCalendar[]) =>
  http.put(CALENDARS_URL, async ({ request }) => {
    const { calendarIds } = (await request.json()) as { calendarIds: string[] };
    return HttpResponse.json({
      data: calendars.map(c => ({ ...c, selected: calendarIds.includes(c.id) })),
      error: null,
    });
  });

const typical = [
  calendar('primary', 'Personal', '#4285f4', true),
  calendar('team@example.com', 'Team', '#0b8043', false),
  calendar('holidays@example.com', 'Holidays in Israel', '#f6bf26', false),
  calendar('birthdays@example.com', 'Birthdays', '#d50000', false),
];

const meta: Meta<typeof CalendarPicker> = {
  title: 'Features/Settings/CalendarPicker',
  component: CalendarPicker,
  decorators: [
    withStoryProviders,
    Story => (
      <div className="mx-auto max-w-md p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CalendarPicker>;

/** The default after OAuth: primary selected, everything else available. */
export const Default: Story = {
  parameters: { msw: { handlers: [listHandler(typical), putHandler(typical)] } },
};

/** Skeleton rows keep the card from collapsing and then jumping. */
export const Loading: Story = {
  parameters: { msw: { handlers: [listHandler([], { hang: true })] } },
};

/**
 * At the cap, unselected calendars lock and the reason is stated. Selected ones
 * stay toggleable — otherwise a user here would have no way back under it.
 */
export const AtSelectionCap: Story = {
  parameters: {
    msw: {
      handlers: (() => {
        const atCap = [
          ...Array.from({ length: MAX_SELECTED_CALENDARS }, (_, i) =>
            calendar(`c${i}`, `Calendar ${i + 1}`, '#4285f4', true)
          ),
          calendar('extra@example.com', 'One too many', '#8e24aa', false),
        ];
        return [listHandler(atCap), putHandler(atCap)];
      })(),
    },
  },
};

/** Google unreachable — the picker says so rather than showing an empty list. */
export const Unavailable: Story = {
  parameters: { msw: { handlers: [listHandler([], { fail: true })] } },
};

/** A Google account with no readable calendars. */
export const Empty: Story = {
  parameters: { msw: { handlers: [listHandler([])] } },
};
