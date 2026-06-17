import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Avatar, AvatarFallback, AvatarImage } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
      <AvatarFallback>NF</AvatarFallback>
    </Avatar>
  ),
};

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="User" />
      <AvatarFallback className="bg-primary font-bold text-primary-foreground">NF</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('NF')).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar className="size-6">
        <AvatarFallback>S</AvatarFallback>
      </Avatar>
      <Avatar className="size-10">
        <AvatarFallback>M</AvatarFallback>
      </Avatar>
      <Avatar className="size-14">
        <AvatarFallback>L</AvatarFallback>
      </Avatar>
    </div>
  ),
};
