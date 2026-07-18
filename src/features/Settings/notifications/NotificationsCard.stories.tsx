import type { Meta, StoryObj } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';

import { makeUser } from '@/mocks/handlers';
import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import { NotificationsCard } from './NotificationsCard';

const API = 'http://localhost:8080/v1';

const prefsHandler = (overrides: Record<string, unknown> = {}, hang = false) =>
  http.get(`${API}/notifications/preferences`, async () => {
    if (hang) await delay(1_000_000);
    return HttpResponse.json({
      data: {
        emailDigest: true,
        pushEnabled: false,
        smsEnabled: false,
        beforeDueMinutes: 1440,
        afterDueMinutes: 0,
        overdueEnabled: true,
        dailySummaryEnabled: true,
        inboxNudgesEnabled: true,
        streaksEnabled: true,
        morningHour: 8,
        eveningHour: 20,
        ...overrides,
      },
      error: null,
    });
  });

const meta: Meta<typeof NotificationsCard> = {
  title: 'Features/Settings/NotificationsCard',
  component: NotificationsCard,
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
type Story = StoryObj<typeof NotificationsCard>;

// Pro user: every control is live.
export const Pro: Story = {
  parameters: {
    preloadedState: { auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } },
    msw: { handlers: [prefsHandler()] },
  },
};

// Free user: Pro rows (email digest, daily summary, inbox, streaks) are locked.
export const Free: Story = {
  parameters: {
    preloadedState: { auth: { user: makeUser({ status: 'regular' }), token: 't', isLoading: false } },
    msw: { handlers: [prefsHandler()] },
  },
};

export const Loading: Story = {
  parameters: {
    preloadedState: { auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } },
    msw: { handlers: [prefsHandler({}, true)] },
  },
};
