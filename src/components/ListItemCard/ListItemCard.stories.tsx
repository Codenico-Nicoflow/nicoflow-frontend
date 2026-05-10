import type { Meta, StoryObj } from '@storybook/react';

import { ListItemCard } from '.';

const meta: Meta<typeof ListItemCard> = {
  title: 'Components/Presentational/ListItemCard',
  component: ListItemCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    children: <span className="text-sm text-foreground">List item content</span>,
    className: 'w-64',
  },
};
export default meta;

type Story = StoryObj<typeof ListItemCard>;

export const Default: Story = {
  args: { variant: 'default', borderColor: 'none', hoverable: true },
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
