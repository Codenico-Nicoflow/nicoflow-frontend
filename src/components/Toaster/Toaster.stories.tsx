import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { expect, screen, within } from 'storybook/test';

import { Button } from '@/components/ui/button';

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
      <p className="text-sm text-muted-foreground">Click a button to trigger a toast</p>
      <div className="flex gap-2">
        <Button onClick={() => toast.success('Project created successfully')}>Success Toast</Button>
        <Button variant="destructive" onClick={() => toast.error('An unexpected error occurred')}>
          Error Toast
        </Button>
        <Button variant="outline" onClick={() => toast.info('Changes saved automatically')}>
          Info Toast
        </Button>
      </div>
      <Toaster />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/click a button/i)).toBeInTheDocument();
  },
};

export const WithSuccessToast: Story = {
  render: () => <Toaster />,
  play: async () => {
    toast.success('Project created successfully');
    await expect(await screen.findByText('Project created successfully')).toBeInTheDocument();
  },
};

export const WithErrorToast: Story = {
  render: () => <Toaster />,
  play: async () => {
    toast.error('An unexpected error occurred');
    await expect(await screen.findByText('An unexpected error occurred')).toBeInTheDocument();
  },
};

export const WithWarningToast: Story = {
  render: () => <Toaster />,
  play: async () => {
    toast.warning('You are approaching your task limit');
    await expect(await screen.findByText('You are approaching your task limit')).toBeInTheDocument();
  },
};
