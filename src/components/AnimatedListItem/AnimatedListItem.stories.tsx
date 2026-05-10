import type { Meta, StoryObj } from '@storybook/react';

import { AnimatedListItem } from '.';

const meta: Meta<typeof AnimatedListItem> = {
  title: 'Components/Presentational/AnimatedListItem',
  component: AnimatedListItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
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
};
