import type { Meta, StoryObj } from '@storybook/react';
import { format, subDays } from 'date-fns';
import { expect, fn, screen, userEvent } from 'storybook/test';

import { mockTask } from '@/stories/mocks';

import TaskItem from './TaskItem';

const pastIso = format(subDays(new Date(), 4), 'yyyy-MM-dd');

const meta: Meta<typeof TaskItem> = {
  title: 'Tasks/TaskItem',
  component: TaskItem,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { index: 0, onEdit: () => {}, onDelete: () => {} },
  decorators: [
    Story => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TaskItem>;

export const Active: Story = {
  args: { task: mockTask({ title: 'Write the spec', status: 'active', energy: 'deep', priority: 'high' }) },
};

export const Completed: Story = {
  args: { task: mockTask({ title: 'Shipped task', status: 'done', energy: 'low' }) },
};

export const CarriedOver: Story = {
  args: {
    task: mockTask({ title: 'Rolled forward, no guilt', status: 'active', scheduledFor: pastIso, rollsOver: true }),
  },
  play: async () => {
    const chips = await screen.findAllByTestId('task-date-carriedOver');
    chips.forEach(chip => expect(chip.className).not.toMatch(/red/));
  },
};

export const Cancelled: Story = {
  args: { task: mockTask({ title: 'Called off', status: 'cancelled', energy: 'medium' }) },
};

// The whole card is clickable and opens the edit action.
export const ClickableCard: Story = {
  args: { task: mockTask({ id: 'clickable', title: 'Click anywhere on me', status: 'active' }), onEdit: fn() },
  play: async ({ args }) => {
    await userEvent.click(await screen.findByTestId('task-card-clickable'));
    await expect(args.onEdit).toHaveBeenCalledTimes(1);
  },
};
