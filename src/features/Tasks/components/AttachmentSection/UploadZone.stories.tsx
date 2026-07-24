import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen } from 'storybook/test';

import { UploadZone } from './UploadZone';

const meta: Meta<typeof UploadZone> = {
  title: 'Tasks/UploadZone',
  component: UploadZone,
  tags: ['autodocs'],
  args: { onFiles: () => {} },
  decorators: [
    Story => (
      <div className="max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof UploadZone>;

export const Default: Story = {
  play: async () => {
    await expect(screen.getByTestId('upload-zone')).toBeInTheDocument();
    await expect(screen.getByTestId('upload-zone-button')).toBeEnabled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async () => {
    await expect(screen.getByTestId('upload-zone-button')).toBeDisabled();
  },
};
