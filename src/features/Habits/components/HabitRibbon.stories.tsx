import type { Meta, StoryObj } from '@storybook/react';

import type { IHabitCell } from '@/lib/types';

import { HabitRibbon } from './HabitRibbon';

// The signature element. Consecutive satisfied cells butt together into ONE
// continuous bar; a miss cuts it. The visible break is the motivational
// mechanic — a streak you scan rather than read.
const meta: Meta<typeof HabitRibbon> = {
  title: 'Habits/HabitRibbon',
  component: HabitRibbon,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="w-80 rounded-xl border border-border/60 bg-card p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof HabitRibbon>;

const day = (offset: number, satisfied: boolean, scheduled = true): IHabitCell => {
  const d = new Date(Date.UTC(2026, 7, 5 - offset));
  return {
    date: d.toISOString().slice(0, 10),
    scheduled,
    value: satisfied ? 1 : 0,
    satisfied,
    progress: null,
  };
};

const run = (length: number, from = 0) => Array.from({ length }, (_, i) => day(from + length - 1 - i, true));

export const UnbrokenRun: Story = {
  args: { cells: run(14), streakUnit: 'day', currentStreak: 14 },
};

// The break is the point: one missed day visibly severs the bar.
export const BrokenByAMiss: Story = {
  args: {
    cells: [...run(5, 9), day(8, false), ...run(8)],
    streakUnit: 'day',
    currentStreak: 8,
  },
};

// A Mon/Wed/Fri habit. The unscheduled days render as a hairline that BRIDGES
// the run rather than cutting it — otherwise the card would show four failures
// a week the user never had.
export const WeekdaysHabit: Story = {
  args: {
    cells: [
      day(6, true),
      day(5, false, false),
      day(4, true),
      day(3, false, false),
      day(2, true),
      day(1, false, false),
      day(0, false, false),
    ],
    streakUnit: 'day',
    currentStreak: 3,
  },
};

export const MostlyEmpty: Story = {
  args: {
    cells: [...Array.from({ length: 12 }, (_, i) => day(13 - i, false)), ...run(2)],
    streakUnit: 'day',
    currentStreak: 2,
  },
};

// A quota habit's cells are WEEKS, each carrying its progress toward the target.
export const QuotaWeeks: Story = {
  args: {
    cells: [
      { date: '2026-07-13', scheduled: true, value: 3, satisfied: true, progress: { current: 3, target: 3 } },
      { date: '2026-07-20', scheduled: true, value: 2, satisfied: false, progress: { current: 2, target: 3 } },
      { date: '2026-07-27', scheduled: true, value: 3, satisfied: true, progress: { current: 3, target: 3 } },
      { date: '2026-08-03', scheduled: true, value: 1, satisfied: false, progress: { current: 1, target: 3 } },
    ],
    streakUnit: 'week',
    currentStreak: 1,
  },
};
