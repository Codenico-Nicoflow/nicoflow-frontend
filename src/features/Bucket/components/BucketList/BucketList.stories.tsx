import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { mockBucket } from '@/stories/mocks';

import { BucketList } from '.';

const meta: Meta<typeof BucketList> = {
  title: 'Bucket/BucketList',
  component: BucketList,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onProcess: () => {}, onEdit: () => {}, onDelete: () => {} },
  decorators: [Story => <div className="mx-auto max-w-2xl p-6">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof BucketList>;

export const Filled: Story = {
  args: {
    isLoading: false,
    buckets: [
      mockBucket({ id: 'b1', content: 'Call the accountant' }),
      mockBucket({ id: 'b2', content: 'Plan the offsite' }),
      mockBucket({ id: 'b3', content: 'Read the new RFC' }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Plan the offsite')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: { isLoading: true, buckets: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  },
};

export const Empty: Story = {
  args: { isLoading: false, buckets: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/your bucket is empty/i)).toBeInTheDocument();
  },
};
