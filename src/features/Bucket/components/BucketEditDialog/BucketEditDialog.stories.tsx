import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen } from 'storybook/test';

import { mockBucket } from '@/stories/mocks';

import { BucketEditDialog } from '.';

const meta: Meta<typeof BucketEditDialog> = {
  title: 'Bucket/BucketEditDialog',
  component: BucketEditDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: () => {}, bucket: mockBucket({ content: 'Refactor the auth flow' }) },
};
export default meta;

type Story = StoryObj<typeof BucketEditDialog>;

export const Default: Story = {
  play: async () => {
    await expect(await screen.findByText('Edit Bucket')).toBeInTheDocument();
    await expect(screen.getByDisplayValue('Refactor the auth flow')).toBeInTheDocument();
  },
};
