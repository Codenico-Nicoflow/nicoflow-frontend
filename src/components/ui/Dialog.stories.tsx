import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';

import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project?</DialogTitle>
          <DialogDescription>This permanently removes the project and all its tasks.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /open dialog/i }));
    // Dialog content portals to document.body — query via screen.
    await expect(await screen.findByText('Delete project?')).toBeInTheDocument();
  },
};

export const OpenByDefault: Story = {
  render: () => (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session expired</DialogTitle>
          <DialogDescription>Please sign in again to continue.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
  play: async () => {
    await expect(await screen.findByText('Session expired')).toBeInTheDocument();
  },
};
