import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { reactRouterParameters } from 'storybook-addon-remix-react-router';

import { mockTask, mockUser } from '@/stories/mocks';

import CalendarView from './index';

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

// Fixed clock so the now-line lands in the same place in every snapshot.
const NOW = new Date(2026, 7, 5, 10, 30);
const DAY = '2026-08-05';

const range = (items: unknown[]) => ({
  msw: { handlers: [http.get(`${API}/tasks`, () => HttpResponse.json(env({ items })))] },
});

// Timed scheduling is Pro, so the default stories sign in as one — a free user
// gets the locked teaser instead (see the Locked* stories below).
const asPlan = (status: 'premium' | 'regular') => ({
  preloadedState: { auth: { user: mockUser({ status }), token: 't', isLoading: false } },
});

const meta: Meta<typeof CalendarView> = {
  title: 'Calendar/CalendarView',
  component: CalendarView,
  tags: ['autodocs'],
  args: { now: NOW },
  parameters: { layout: 'fullscreen', ...asPlan('premium'), ...range([]) },
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

const monthAt = (searchParams: Record<string, string>) =>
  reactRouterParameters({
    location: { path: '/calendar', searchParams: { view: 'month', ...searchParams } },
    routing: { path: '/calendar' },
  });

/**
 * Desktop month. Wide enough for real chips, so a cell shows the first few
 * tasks and collapses the rest into a count rather than scrolling.
 */
export const DesktopMonth: Story = {
  parameters: {
    reactRouter: monthAt({ date: DAY }),
    ...range([
      mockTask({ id: 'm1', title: 'Standup', scheduledFor: DAY, scheduledTime: '09:00' }),
      mockTask({ id: 'm2', title: 'Design review', scheduledFor: DAY, scheduledTime: '11:00' }),
      mockTask({ id: 'm3', title: 'Read the RFC', scheduledFor: DAY, scheduledTime: null }),
      mockTask({ id: 'm4', title: '1:1', scheduledFor: '2026-08-12', scheduledTime: '15:00' }),
    ]),
  },
};

/** A day busier than the cap keeps three chips and counts the remainder. */
export const DesktopMonthOverflow: Story = {
  parameters: {
    reactRouter: monthAt({ date: DAY }),
    ...range(
      Array.from({ length: 6 }, (_, index) =>
        mockTask({
          id: `o${index}`,
          title: `Task ${index + 1}`,
          scheduledFor: DAY,
          scheduledTime: `${String(index + 8).padStart(2, '0')}:00`,
        })
      )
    ),
  },
};

/** An empty month reads as empty, never as a broken or still-loading grid. */
export const DesktopMonthEmpty: Story = {
  parameters: { reactRouter: monthAt({ date: DAY }) },
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

/**
 * The conversion surface. A free user sees their OWN month behind the blur —
 * real counts, real chips — because locked real data converts far better than a
 * hidden nav item or a generic screenshot.
 */
export const LockedTeaser: Story = {
  parameters: {
    ...asPlan('regular'),
    ...range([
      mockTask({ id: 'p1', title: 'Standup', scheduledFor: DAY, scheduledTime: '09:00' }),
      mockTask({ id: 'p2', title: 'Design review', scheduledFor: DAY, scheduledTime: '11:00' }),
      mockTask({ id: 'p3', title: '1:1', scheduledFor: '2026-08-12', scheduledTime: '15:00' }),
    ]),
  },
};

/** Locked resolves to the month teaser at any width; the phone gets density dots. */
export const LockedTeaserMobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    ...asPlan('regular'),
    ...range([
      mockTask({ id: 'p4', scheduledFor: DAY, scheduledTime: '09:00' }),
      mockTask({ id: 'p5', scheduledFor: '2026-08-12', scheduledTime: '15:00' }),
    ]),
  },
};

/**
 * Untimed tasks have a date but no hour, so they sit in the all-day rail above
 * the grid. Completed work stays visible but recedes, and the rail is capped so
 * one heavy day can't push the hour grid below the fold.
 */
export const AllDayRailWithCompleted: Story = {
  parameters: range([
    mockTask({ id: 'ad1', title: 'Read the RFC', scheduledFor: DAY, scheduledTime: null }),
    mockTask({ id: 'ad2', title: 'Shipped the release', scheduledFor: DAY, scheduledTime: null, status: 'done' }),
    mockTask({ id: 'ad3', title: 'Standup', scheduledFor: DAY, scheduledTime: '09:00', estimatedMinutes: 30 }),
  ]),
};

/** Past the cap the rail collapses behind "+N more" instead of growing. */
export const AllDayRailOverflow: Story = {
  parameters: range(
    Array.from({ length: 5 }, (_, index) =>
      mockTask({ id: `ov${index}`, title: `Untimed task ${index + 1}`, scheduledFor: DAY, scheduledTime: null })
    )
  ),
};
