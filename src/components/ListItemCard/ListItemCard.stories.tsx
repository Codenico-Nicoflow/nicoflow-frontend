import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { ListItemCard } from '.';

const meta: Meta<typeof ListItemCard> = {
  title: 'Components/Presentational/ListItemCard',
  component: ListItemCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'compact', 'comfortable'] },
    borderColor: { control: 'select', options: ['none', 'primary', 'success', 'muted', 'default'] },
    hoverable: { control: 'boolean' },
  },
  args: {
    children: <span className="text-sm text-foreground">List item content</span>,
    className: 'w-64',
  },
};
export default meta;

type Story = StoryObj<typeof ListItemCard>;

export const Default: Story = {
  args: { variant: 'default', borderColor: 'none', hoverable: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('List item content')).toBeInTheDocument();
  },
};

export const Compact: Story = {
  args: { variant: 'compact', borderColor: 'none', hoverable: true },
};

export const Comfortable: Story = {
  args: { variant: 'comfortable', borderColor: 'none', hoverable: true },
};

export const BorderPrimary: Story = {
  args: { variant: 'default', borderColor: 'primary', hoverable: true },
};

export const BorderSuccess: Story = {
  args: { variant: 'default', borderColor: 'success', hoverable: true },
};

export const BorderMuted: Story = {
  args: { variant: 'default', borderColor: 'muted', hoverable: true },
};

export const NotHoverable: Story = {
  args: { variant: 'default', borderColor: 'none', hoverable: false },
};
