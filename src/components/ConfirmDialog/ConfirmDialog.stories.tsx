import type { Meta, StoryObj } from '@storybook/react';
import { Trash2 } from 'lucide-react';
import { expect, screen } from 'storybook/test';

import { ConfirmDialog } from '.';

// Dialog renders open in the canvas so the Controls panel visibly drives it.
const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/Dialogs/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onOpenChange: () => {},
    onConfirm: () => {},
    title: 'Delete Project',
    description: 'This action cannot be undone. All tasks within this project will be permanently deleted.',
    icon: Trash2,
    variant: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    destructive: true,
    isLoading: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['danger', 'warning', 'info'] },
    isLoading: { control: 'boolean' },
    destructive: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    confirmLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

export const Danger: Story = {
  play: async () => {
    await expect(await screen.findByText('Delete Project')).toBeInTheDocument();
    await expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Archive Project',
    description: 'Archiving hides this project from your active list. You can restore it later.',
    confirmLabel: 'Archive',
    destructive: false,
  },
  play: async () => {
    await expect(await screen.findByText('Archive Project')).toBeInTheDocument();
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Mark as Complete',
    description: 'Mark this project as complete? You can reopen it any time.',
    confirmLabel: 'Complete',
    destructive: false,
  },
};

export const Loading: Story = {
  args: { isLoading: true },
  play: async () => {
    await expect(await screen.findByRole('button', { name: /delete\.\.\./i })).toBeDisabled();
  },
};
