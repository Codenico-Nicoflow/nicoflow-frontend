import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import Bucket from './Bucket';
import NextSevenDays from './NextSevenDays';
import Today from './Today';
import Tomorrow from './Tomorrow';

// The quick-access destinations are PageStubs today (real time-spread views
// land in Phase 2 of the roadmap). Grouped here so the routes are visible.
const meta: Meta = {
  title: 'Pages/QuickAccess',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

export const BucketView: Story = {
  render: () => <Bucket />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Bucket')).toBeInTheDocument();
  },
};

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
