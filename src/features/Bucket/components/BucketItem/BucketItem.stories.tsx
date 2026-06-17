import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { mockBucket } from '@/stories/mocks';

import { BucketItem } from '.';

const meta: Meta<typeof BucketItem> = {
  title: 'Bucket/BucketItem',
  component: BucketItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { index: 0, onProcess: () => {}, onEdit: () => {}, onDelete: () => {} },
  decorators: [Story => <div className="w-[32rem]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof BucketItem>;

export const Default: Story = {
  args: { bucket: mockBucket({ content: 'Email the design team about the new palette' }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/email the design team/i)).toBeInTheDocument();
  },
};

export const LongContent: Story = {
  args: {
    bucket: mockBucket({
      content:
        'Draft the Q2 roadmap: gather input from each area lead, reconcile with the 25-sprint plan, and circulate for review before Friday.',
    }),
  },
};
