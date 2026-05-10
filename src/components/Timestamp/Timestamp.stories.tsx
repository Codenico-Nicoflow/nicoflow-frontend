import type { Meta, StoryObj } from '@storybook/react';

import { Timestamp } from '.';

const meta: Meta<typeof Timestamp> = {
  title: 'Components/Presentational/Timestamp',
  component: Timestamp,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Timestamp>;

export const RecentDate: Story = {
  args: {
    date: '2026-05-01T10:30:00Z',
    addSuffix: true,
  },
};

export const OldDate: Story = {
  args: {
    date: '2025-01-15T08:00:00Z',
    addSuffix: true,
  },
};

export const WithoutSuffix: Story = {
  args: {
    date: '2026-04-20T12:00:00Z',
    addSuffix: false,
  },
};
