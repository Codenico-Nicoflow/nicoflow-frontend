import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import { mockTask } from '@/stories/mocks';

import TimeSpreadView from './index';

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

const offset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const spread = {
  today: [
    mockTask({ id: 'a', title: 'Reply to the designer', energy: 'low', scheduledFor: offset(0) }),
    mockTask({ id: 'b', title: 'Carried over, no guilt', scheduledFor: offset(-2), rollsOver: true }),
  ],
  tomorrow: [mockTask({ id: 'c', title: 'Draft the launch post', scheduledFor: offset(1) })],
  thisWeek: [
    mockTask({ id: 'd', title: 'Midweek review', scheduledFor: offset(2) }),
    mockTask({ id: 'e', title: 'End-of-week wrap', scheduledFor: offset(4) }),
  ],
};

const meta: Meta<typeof TimeSpreadView> = {
  title: 'TimeSpread/TimeSpreadView',
  component: TimeSpreadView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: [http.get(`${API}/time-spread`, () => HttpResponse.json(env(spread)))] },
  },
};
export default meta;

type Story = StoryObj<typeof TimeSpreadView>;

export const Today: Story = { args: { bucket: 'today' } };
export const Tomorrow: Story = { args: { bucket: 'tomorrow' } };
export const NextSevenDays: Story = { args: { bucket: 'week' } };

export const Empty: Story = {
  args: { bucket: 'today' },
  parameters: {
    msw: {
      handlers: [
        http.get(`${API}/time-spread`, () => HttpResponse.json(env({ today: [], tomorrow: [], thisWeek: [] }))),
      ],
    },
  },
};
