import type { Meta, StoryObj } from '@storybook/react';

import type { IGoogleEvent } from '@/lib/store';
import type { ITask } from '@/lib/types';
import { TaskPriority, TaskStatus } from '@/lib/types';
import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import HourGrid from './HourGrid';

const DAY = '2026-08-03';
const NOW = new Date('2026-08-03T10:30:00Z');

const task = (id: string, title: string, scheduledTime: string, estimatedMinutes: number | null = 60): ITask =>
  ({
    id,
    projectId: 'p1',
    title,
    status: TaskStatus.ACTIVE,
    priority: TaskPriority.MEDIUM,
    scheduledFor: DAY,
    scheduledTime,
    estimatedMinutes,
    displayOrder: 0,
    subtaskCount: 0,
    openSubtaskCount: 0,
    totalFocusSeconds: 0,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  }) as unknown as ITask;

const event = (id: string, title: string, from: string, to: string): IGoogleEvent => ({
  id,
  title,
  start: `${DAY}T${from}:00+03:00`,
  end: `${DAY}T${to}:00+03:00`,
  allDay: false,
  calendarId: 'primary',
  htmlLink: 'https://calendar.google.com/event',
});

const tasks = [task('t1', 'Write the spec', '09:00', 90), task('t2', 'Review PRs', '13:00')];

const meta: Meta<typeof HourGrid> = {
  title: 'Features/Calendar/GoogleWash',
  component: HourGrid,
  decorators: [
    withStoryProviders,
    Story => (
      <div className="h-[600px] max-w-2xl overflow-y-auto border border-border">
        <Story />
      </div>
    ),
  ],
  args: {
    days: [new Date(`${DAY}T00:00:00`)],
    tasksByDay: new Map([[DAY, tasks]]),
    now: NOW,
    todayKey: DAY,
    onSelect: () => {},
    onSelectGoogleEvent: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof HourGrid>;

/** Tasks only — the baseline every other story must not shift. */
export const WithoutGoogleEvents: Story = {
  args: { googleEvents: [] },
};

/**
 * The same tasks with events behind them. Compare against WithoutGoogleEvents:
 * no task block moves or narrows, which is the guarantee the wash geometry
 * exists to provide.
 */
export const WithGoogleEvents: Story = {
  args: {
    googleEvents: [event('a', 'Standup', '09:00', '09:30'), event('b', 'Design review', '13:30', '15:00')],
  },
};

/** Double-booked: the tint deepens rather than the events splitting width. */
export const OverlappingEvents: Story = {
  args: {
    googleEvents: [
      event('a', 'Standup', '09:00', '11:00'),
      event('b', 'Design review', '10:00', '12:00'),
      event('c', 'Skip-level', '10:30', '11:30'),
    ],
  },
};

/** A task overlapping a meeting picks up the left-edge conflict accent. */
export const ConflictAccent: Story = {
  args: {
    googleEvents: [event('a', 'Standup', '09:30', '10:30')],
  },
};

/** All-day events join the rail, visually distinct from the user's own tasks. */
export const AllDayEvents: Story = {
  args: {
    googleEvents: [
      { ...event('h1', 'Independence Day', '00:00', '00:00'), allDay: true, start: DAY, end: '2026-08-04' },
      { ...event('h2', 'Team offsite', '00:00', '00:00'), allDay: true, start: DAY, end: '2026-08-04' },
      { ...event('h3', "Ada's birthday", '00:00', '00:00'), allDay: true, start: DAY, end: '2026-08-04' },
    ],
  },
};
