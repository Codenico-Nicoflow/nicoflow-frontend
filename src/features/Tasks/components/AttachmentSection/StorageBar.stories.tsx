import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { StorageBar } from './StorageBar';

const MB = 1024 * 1024;
const LIMIT = 100 * MB;

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
export const Ok: Story = { args: { usedBytes: 30 * MB, limitBytes: LIMIT } };

// Amber — 82 MB used, the warning band.
export const Warning: Story = {
  args: { usedBytes: 82 * MB, limitBytes: LIMIT },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('82.0 MB of 100 MB')).toBeInTheDocument();
    await expect(canvas.getByTestId('storage-bar')).toHaveAttribute('data-level', 'warning');
  },
};

// Red — at/above 95%.
export const Critical: Story = { args: { usedBytes: 98 * MB, limitBytes: LIMIT } };

// Usage request still in flight.
export const Loading: Story = { args: { isLoading: true } };
