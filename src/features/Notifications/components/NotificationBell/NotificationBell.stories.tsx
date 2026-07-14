import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import { Popover } from '@/components/ui/popover';
import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import { NotificationBell } from './index';

const countHandler = (count: number) =>
  http.get('http://localhost:8080/v1/notifications/unread-count', () =>
    HttpResponse.json({ data: { count }, error: null })
  );

const meta: Meta<typeof NotificationBell> = {
  title: 'Features/Notifications/NotificationBell',
  component: NotificationBell,
  decorators: [
    withStoryProviders,
    Story => (
      <Popover>
        <Story />
      </Popover>
    ),
  ],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof NotificationBell>;

export const NoUnread: Story = {
  parameters: { msw: { handlers: [countHandler(0)] } },
};

export const OneUnread: Story = {
  parameters: { msw: { handlers: [countHandler(1)] } },
};

export const ManyUnread: Story = {
  parameters: { msw: { handlers: [countHandler(5)] } },
};

export const Capped: Story = {
  parameters: { msw: { handlers: [countHandler(150)] } },
};
