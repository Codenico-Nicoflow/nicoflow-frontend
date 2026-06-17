import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Separator } from './separator';

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-64">
      <p className="text-sm text-foreground">Above</p>
      <Separator className="my-3" />
      <p className="text-sm text-muted-foreground">Below</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('separator')).toBeInTheDocument();
  },
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3">
      <span className="text-sm">Home</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Projects</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Settings</span>
    </div>
  ),
};
