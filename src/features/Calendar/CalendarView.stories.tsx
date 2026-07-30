import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { reactRouterParameters } from 'storybook-addon-remix-react-router';

import { mockTask } from '@/stories/mocks';

import CalendarView from './index';

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

// Fixed clock so the now-line lands in the same place in every snapshot.
const NOW = new Date(2026, 7, 5, 10, 30);
const DAY = '2026-08-05';

const range = (items: unknown[]) => ({
  msw: { handlers: [http.get(`${API}/tasks`, () => HttpResponse.json(env({ items })))] },
});

const meta: Meta<typeof CalendarView> = {
  title: 'Calendar/CalendarView',
  component: CalendarView,
  tags: ['autodocs'],
  args: { now: NOW },
  parameters: { layout: 'fullscreen', ...range([]) },
};
export default meta;

type Story = StoryObj<typeof CalendarView>;

export const Empty: Story = {};

export const WithTimedTasks: Story = {
  parameters: range([
    mockTask({ id: 'a', title: 'Standup', scheduledFor: DAY, scheduledTime: '09:00', estimatedMinutes: 30 }),
    mockTask({ id: 'b', title: 'Design review', scheduledFor: DAY, scheduledTime: '11:00', estimatedMinutes: 60 }),
  ]),
};

/** Unestimated blocks are visually distinct — the 30-min height is rendered, never stored. */
export const Unestimated: Story = {
  parameters: range([
    mockTask({ id: 'c', title: 'Deep work', scheduledFor: DAY, scheduledTime: '14:00', estimatedMinutes: null }),
  ]),
};

/** Two tasks at the same hour is a real planning conflict, so both stay visible. */
export const Overlapping: Story = {
  parameters: range([
    mockTask({ id: 'd', title: 'Interview', scheduledFor: DAY, scheduledTime: '09:00', estimatedMinutes: 60 }),
    mockTask({ id: 'e', title: 'Sync', scheduledFor: DAY, scheduledTime: '09:30', estimatedMinutes: 60 }),
  ]),
};

export const WithAllDay: Story = {
  parameters: range([
    mockTask({ id: 'f', title: 'Read the RFC', scheduledFor: DAY, scheduledTime: null }),
    mockTask({ id: 'g', title: 'Standup', scheduledFor: DAY, scheduledTime: '09:00', estimatedMinutes: 30 }),
  ]),
};

/**
 * Below 768px the week becomes a vertical agenda — a 7-column grid at phone
 * width is ~50px per day, too narrow to read a title or hit a block.
 */
export const MobileAgenda: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    reactRouter: reactRouterParameters({
      location: { path: '/calendar', searchParams: { view: 'week', date: DAY } },
      routing: { path: '/calendar' },
    }),
    ...range([
      mockTask({ id: 'h', title: 'Standup', scheduledFor: DAY, scheduledTime: '09:00', estimatedMinutes: 30 }),
      mockTask({ id: 'i', title: 'Read the RFC', scheduledFor: DAY, scheduledTime: null }),
    ]),
  },
};

/** Month answers "which days are heavy?"; tapping a cell drills into the day. */
export const MonthDensityGrid: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    reactRouter: reactRouterParameters({
      location: { path: '/calendar', searchParams: { view: 'month', date: DAY } },
      routing: { path: '/calendar' },
    }),
    ...range([
      mockTask({ id: 'j', scheduledFor: DAY, scheduledTime: '09:00' }),
      mockTask({ id: 'k', scheduledFor: DAY, scheduledTime: '11:00' }),
      mockTask({ id: 'l', scheduledFor: '2026-08-12', scheduledTime: '14:00' }),
    ]),
  },
};
