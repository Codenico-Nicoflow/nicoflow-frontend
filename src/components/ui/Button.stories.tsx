import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Trash2 } from 'lucide-react';
import { expect, within } from 'storybook/test';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'xl', 'icon'] },
    disabled: { control: 'boolean' },
  },
  args: { children: 'Button' },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Button' })).toBeInTheDocument();
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Destructive' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('button')).toHaveLength(6);
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
      <Button size="icon" aria-label="Add">
        <Plus />
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button>
        <Plus />
        New project
      </Button>
      <Button variant="destructive">
        <Trash2 />
        Delete
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  },
};
