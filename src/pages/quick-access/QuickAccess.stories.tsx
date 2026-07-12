import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import NextSevenDays from './NextSevenDays';
import Today from './Today';
import Tomorrow from './Tomorrow';

// The time-spread destinations are PageStubs today (real Today/Tomorrow/Next-7
// views land later in Phase 2). Bucket is built — see Bucket.stories.tsx.
const meta: Meta = {
  title: 'Pages/QuickAccess',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

export const TodayView: Story = {
  render: () => <Today />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Today')).toBeInTheDocument();
  },
};

export const TomorrowView: Story = {
  render: () => <Tomorrow />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Tomorrow')).toBeInTheDocument();
  },
};

export const NextSevenDaysView: Story = {
  render: () => <NextSevenDays />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Next 7 Days')).toBeInTheDocument();
  },
};
