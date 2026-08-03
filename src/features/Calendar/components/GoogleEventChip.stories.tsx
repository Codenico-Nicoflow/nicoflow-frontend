import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';
import type { ITask } from '@/lib/types';
import { TaskPriority, TaskStatus } from '@/lib/types';
import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import { resolveCalendarPrefs } from '../displayPrefs';

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

const event = (id: string, title: string, from: string, to: string, calendarId = 'primary'): IGoogleEvent => ({
  id,
  title,
  start: `${DAY}T${from}:00+03:00`,
  end: `${DAY}T${to}:00+03:00`,
  allDay: false,
  calendarId,
  htmlLink: 'https://calendar.google.com/event',
});

/** Google's own hues, so a calendar reads the same colour it does in Google. */
const calendars: IGoogleCalendar[] = [
  { id: 'primary', summary: 'Work', backgroundColor: '#4285f4', primary: true, selected: true },
  { id: 'family', summary: 'Family', backgroundColor: '#0b8043', primary: false, selected: true },
  { id: 'holidays', summary: 'Holidays', backgroundColor: '#8e24aa', primary: false, selected: true },
];

const tasks = [task('t1', 'Write the spec', '09:00', 90), task('t2', 'Review PRs', '13:00')];

const meta: Meta<typeof HourGrid> = {
  title: 'Features/Calendar/GoogleEventChip',
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
    googleCalendars: calendars,
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
 * Events with no tasks in the way — the ordinary case, and the one a fixed-width
 * strip got wrong. Nothing competes for the minutes, so each chip takes the
 * whole column exactly as a lone task block would.
 */
export const EventsOnly: Story = {
  args: {
    tasksByDay: new Map(),
    googleEvents: [
      event('a', 'Standup', '09:00', '09:30'),
      event('b', 'School pickup', '11:00', '12:00', 'family'),
      event('c', 'Design review', '13:30', '15:00', 'holidays'),
    ],
  },
};

/**
 * The same tasks with events beside them. Compare against WithoutGoogleEvents:
 * no task block moves or narrows — the events give up the width, never the
 * user's own work.
 */
export const WithGoogleEvents: Story = {
  args: {
    googleEvents: [event('a', 'Standup', '09:00', '09:30'), event('b', 'Design review', '13:30', '15:00')],
  },
};

/**
 * Double-booked: the chips lane against each other inside the overlay strip and
 * the band beneath them deepens. Neither takes a pixel from a task block.
 */
export const OverlappingEvents: Story = {
  args: {
    googleEvents: [
      event('a', 'Standup', '09:00', '11:00'),
      event('b', 'Design review', '10:00', '12:00', 'family'),
      event('c', 'Skip-level', '10:30', '11:30', 'holidays'),
    ],
  },
};

/** One colour per calendar, taken from Google so the hues match what the user knows. */
export const MultipleCalendars: Story = {
  args: {
    googleEvents: [
      event('a', 'Standup', '09:00', '09:30'),
      event('b', 'School pickup', '11:00', '12:00', 'family'),
      event('c', 'Bank holiday briefing', '14:00', '15:00', 'holidays'),
    ],
  },
};

/**
 * A calendar the picker never returned — unshared, deleted, or still loading.
 * It gets a stable hashed hue rather than a grey placeholder that changes later.
 */
export const UnknownCalendar: Story = {
  args: {
    googleCalendars: [],
    googleEvents: [event('a', 'Standup', '09:00', '10:00'), event('b', 'Retro', '11:00', '12:00', 'family')],
  },
};

/** Short meetings drop the time line rather than clipping two lines of text. */
export const ShortEvents: Story = {
  args: {
    googleEvents: [
      event('a', 'Standup', '09:00', '09:15'),
      event('b', 'Sync', '09:30', '09:40', 'family'),
      event('c', 'Design review', '11:00', '12:00', 'holidays'),
    ],
  },
};

/** A declined meeting still blocks the time, but must not read as expected. */
export const DeclinedEvent: Story = {
  args: {
    googleEvents: [
      { ...event('a', 'Optional all-hands', '09:00', '10:00'), responseStatus: 'declined' },
      event('b', 'Design review', '11:00', '12:00', 'family'),
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

/**
 * A working-hours window (08:00–18:00). The night hours are gone and the rows
 * are taller for it, which is what makes the 15-minute blocks below legible.
 */
export const WorkingHoursWindow: Story = {
  args: {
    prefs: resolveCalendarPrefs({ dayStartHour: 8, dayEndHour: 18 }),
    googleEvents: [event('a', 'Standup', '09:00', '09:15'), event('b', 'Design review', '13:30', '15:00', 'family')],
  },
};

/**
 * Short blocks at the base 48px/hour vs the same blocks in a narrowed window.
 * A 15-minute block is drawn at the 30-minute floor either way, so it never
 * collapses to a hairline — but the taller rows are what make it readable.
 */
export const ShortBlocksInWindow: Story = {
  args: {
    prefs: resolveCalendarPrefs({ dayStartHour: 8, dayEndHour: 14 }),
    tasksByDay: new Map([[DAY, [task('t1', 'Quick call', '09:00', 15), task('t2', 'Review', '10:00', 30)]]]),
    googleEvents: [event('a', 'Sync', '11:00', '11:15')],
  },
};

/**
 * Work scheduled outside the chosen window still appears — the grid widens to
 * fit it. A display preference that hid scheduled work would read as data loss.
 */
export const AutoExpandsForEarlyWork: Story = {
  args: {
    prefs: resolveCalendarPrefs({ dayStartHour: 9, dayEndHour: 17 }),
    tasksByDay: new Map([[DAY, [task('t1', 'Early flight', '06:00', 60)]]]),
    googleEvents: [event('a', 'Standup', '09:00', '09:30')],
  },
};

/**
 * The reported clipping case (NIC-1892): a 05:00–24:00 window with 15-minute
 * tasks. The 19-hour span keeps rows near the base height, so the boxes are too
 * short for two lines — the meta line is dropped rather than cut mid-glyph.
 */
export const ShortTasksInWideWindow: Story = {
  args: {
    prefs: resolveCalendarPrefs({ dayStartHour: 5, dayEndHour: 24 }),
    tasksByDay: new Map([
      [
        DAY,
        [
          task('t1', 'Water the plants', '08:00', 15),
          task('t2', 'Drill the bathtub seat hole', '11:00', 15),
          task('t3', 'Fold laundry', '13:30', 30),
        ],
      ],
    ]),
    googleEvents: [],
  },
  // Runs in real Chromium under the Storybook test project, so this measures
  // actual layout — the clipping it guards against is invisible to jsdom, which
  // reports every height as 0.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const id of ['t1', 't2', 't3']) {
      const block = await canvas.findByTestId(`calendar-block-${id}`);
      // The bug: content taller than its box, cut through the middle of the
      // glyphs. Any positive overflow here is the regression.
      await expect(block.scrollHeight).toBeLessThanOrEqual(block.clientHeight);
    }

    // The title must survive — dropping a line is only acceptable while the
    // block still says which task it is.
    await expect(await canvas.findByText('Water the plants')).toBeVisible();
  },
};

/**
 * Several tasks and several events on one day (NIC-1893). Tasks and chips
 * reserve each other's columns from both sides, so no block is ever painted
 * over: a task keeps the leading column and the chip takes what is left, both
 * against the same divisor.
 */
export const TasksAndEventsTogether: Story = {
  args: {
    tasksByDay: new Map([
      [
        DAY,
        [
          task('t1', 'Clean Mamad', '12:30', 120),
          task('t2', 'Write the spec', '09:00', 90),
          task('t3', 'Habit feature', '16:00', 60),
        ],
      ],
    ]),
    googleEvents: [
      event('a', 'Standup', '09:00', '09:30'),
      event('b', 'Design review', '12:30', '14:00', 'family'),
      event('c', 'Evening class', '19:00', '20:00', 'holidays'),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A task overlapping an event gives up half the column but keeps the
    // leading edge — the user's own work is never the thing pushed aside.
    const clean = await canvas.findByTestId('calendar-block-wrapper-t1');
    const review = await canvas.findByTestId('google-event-chip-b');
    await expect(clean.style.width).toBe('50%');
    await expect(clean.style.insetInlineStart).toBe('0%');
    await expect(review.style.insetInlineStart).toBe('50%');

    // Same divisor on both sides: a mismatch shows up as a gap or an overlap.
    await expect(clean.style.width).toBe(review.style.width);

    // Real geometry — the boxes must not intersect horizontally.
    const taskBox = clean.getBoundingClientRect();
    const chipBox = review.getBoundingClientRect();
    await expect(taskBox.right).toBeLessThanOrEqual(Math.ceil(chipBox.left));

    // An event nobody competes with still spans the full column.
    const evening = await canvas.findByTestId('google-event-chip-c');
    await expect(evening.style.width).toBe('100%');

    // And a task nobody competes with keeps its full width too.
    const habit = await canvas.findByTestId('calendar-block-wrapper-t3');
    await expect(habit.style.width).toBe('100%');
  },
};
