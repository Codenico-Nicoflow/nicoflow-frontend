import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import type { IAttachment } from '@/lib/types';

import { StorageBar } from './StorageBar';

const MB = 1024 * 1024;

const att = (fileSize: number, id: string): IAttachment => ({
  id,
  ownerType: 'task',
  ownerId: 'task-1',
  fileName: `${id}.pdf`,
  fileSize,
  mimeType: 'application/pdf',
  createdAt: '2026-07-24T08:00:00Z',
});

const meta: Meta<typeof StorageBar> = {
  title: 'Tasks/StorageBar',
  component: StorageBar,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof StorageBar>;

// Green — well under the 100 MB cap.
export const Ok: Story = { args: { attachments: [att(20 * MB, 'a'), att(10 * MB, 'b')] } };

// Amber — 82 MB used, the warning band.
export const Warning: Story = {
  args: { attachments: [att(82 * MB, 'a')] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('82.0 MB of 100 MB')).toBeInTheDocument();
    await expect(canvas.getByTestId('storage-bar')).toHaveAttribute('data-level', 'warning');
  },
};

// Red — at/above 95%.
export const Critical: Story = { args: { attachments: [att(98 * MB, 'a')] } };
