import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { expect, within } from 'storybook/test';

import { Toaster } from '.';

const meta: Meta<typeof Toaster> = {
  title: 'Components/Theme/Toaster',
  component: Toaster,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">Toaster is mounted — trigger a toast to see it</p>
      <Toaster />
    </div>
  ),
};

export const WithSuccessToast: Story = {
  render: () => <Toaster />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    toast.success('Project created successfully');
    await expect(canvas).toBeTruthy();
  },
};

export const WithErrorToast: Story = {
  render: () => <Toaster />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    toast.error('An unexpected error occurred');
    await expect(canvas).toBeTruthy();
  },
};
