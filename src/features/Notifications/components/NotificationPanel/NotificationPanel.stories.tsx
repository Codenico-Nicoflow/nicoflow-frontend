import type { INotification } from '@nicoflow/shared/types';
import type { Meta, StoryObj } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';

import { Popover, PopoverAnchor } from '@/components/ui/popover';
import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import { NotificationPanel } from './index';

const API = 'http://localhost:8080/v1';

const makeNotification = (o: Partial<INotification> = {}): INotification => ({
  id: 'n1',
  type: 'task_due_soon',
  title: 'Task due soon',
  body: 'Buy milk',
  metadata: {},
  isRead: false,
  readAt: null,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  ...o,
});

const listHandler = (items: INotification[], withDelay = false) =>
  http.get(`${API}/notifications`, async () => {
    if (withDelay) await delay(1_000_000); // hang → perpetual loading state
    return HttpResponse.json({ data: { items, nextCursor: '' }, error: null });
  });

const meta: Meta<typeof NotificationPanel> = {
  title: 'Features/Notifications/NotificationPanel',
  component: NotificationPanel,
  decorators: [
    withStoryProviders,
    // Keep the popover open and anchored so the portalled content is visible.
    Story => (
      <div className="flex min-h-64 items-start justify-center pt-8">
        <Popover open>
          <PopoverAnchor />
          <Story />
        </Popover>
      </div>
    ),
  ],
  args: { open: true },
};

export default meta;
type Story = StoryObj<typeof NotificationPanel>;

export const Populated: Story = {
  parameters: {
    msw: {
      handlers: [
        listHandler([
          makeNotification({ id: 'n1', title: 'Task due soon', body: 'Buy milk' }),
          makeNotification({
            id: 'n2',
            title: 'Task due soon',
            body: 'Call the bank',
            createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
          }),
          makeNotification({
            id: 'n3',
            title: 'Task due soon',
            body: 'Review the pull request',
            isRead: true,
            readAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          }),
        ]),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: { msw: { handlers: [listHandler([])] } },
};

export const Loading: Story = {
  parameters: { msw: { handlers: [listHandler([], true)] } },
};
