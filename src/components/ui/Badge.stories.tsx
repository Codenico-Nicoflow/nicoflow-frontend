import type { Meta, StoryObj } from '@storybook/react';
import { Check } from 'lucide-react';
import { expect, within } from 'storybook/test';

import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'secondary', 'destructive', 'outline'] },
  },
  args: { children: 'Badge' },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Badge')).toBeInTheDocument();
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Destructive')).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  render: () => (
    <Badge variant="secondary">
      <Check />
      Completed
    </Badge>
  ),
};
