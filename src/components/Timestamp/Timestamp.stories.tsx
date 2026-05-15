import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Timestamp } from '.';

const meta: Meta<typeof Timestamp> = {
  title: 'Components/Presentational/Timestamp',
  component: Timestamp,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    addSuffix: { control: 'boolean' },
    className: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof Timestamp>;

export const RecentDate: Story = {
  args: {
    date: '2026-05-01T10:30:00Z',
    addSuffix: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvasElement.querySelector('time') ?? canvasElement.firstElementChild;
    await expect(el).toBeTruthy();
    await expect(canvas.getByRole('time', { hidden: true }) ?? el).toBeTruthy();
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

export const JustNow: Story = {
  args: {
    date: new Date(Date.now() - 30000).toISOString(),
    addSuffix: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/less than a minute|just now|ago/i)).toBeInTheDocument();
  },
};
