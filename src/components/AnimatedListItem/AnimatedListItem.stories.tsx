import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { AnimatedListItem } from '.';

const meta: Meta<typeof AnimatedListItem> = {
  title: 'Components/Presentational/AnimatedListItem',
  component: AnimatedListItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    index: { control: 'number' },
    delay: { control: 'number' },
    className: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof AnimatedListItem>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-3 bg-card border rounded-lg text-sm text-foreground w-64">Animated list item content</div>
    ),
    index: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Animated list item content')).toBeInTheDocument();
  },
};

export const StaggeredList: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      {Array.from({ length: 5 }).map((_, i) => (
        <AnimatedListItem key={i} index={i}>
          <div className="p-3 bg-card border rounded-lg text-sm text-foreground">Item {i + 1}</div>
        </AnimatedListItem>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Item 1')).toBeInTheDocument();
    await expect(canvas.getByText('Item 5')).toBeInTheDocument();
  },
};
