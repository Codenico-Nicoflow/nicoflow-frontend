import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen } from 'storybook/test';

import { BucketDeleteDialog } from '.';

const meta: Meta<typeof BucketDeleteDialog> = {
  title: 'Bucket/BucketDeleteDialog',
  component: BucketDeleteDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: () => {}, bucketId: 'bucket-1' },
};
export default meta;

type Story = StoryObj<typeof BucketDeleteDialog>;

export const Default: Story = {
  play: async () => {
    await expect(await screen.findByText('Delete Bucket Item')).toBeInTheDocument();
  },
};
