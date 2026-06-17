import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import { expect, screen, userEvent, within } from 'storybook/test';

import { Button } from '@/components/ui/button';

import { ConfirmDialog } from '.';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/Dialogs/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
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

const DialogWrapper = ({
  children,
}: {
  children: (props: { open: boolean; onOpenChange: (v: boolean) => void }) => React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      {children({ open, onOpenChange: setOpen })}
    </div>
  );
};

export const DangerVariant: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <ConfirmDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Delete Project"
          description="This action cannot be undone. All tasks within this project will be permanently deleted."
          icon={Trash2}
          variant="danger"
          confirmLabel="Delete"
          destructive
          onConfirm={() => onOpenChange(false)}
        />
      )}
    </DialogWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    await user.click(canvas.getByRole('button', { name: /open dialog/i }));
    await expect(await screen.findByText('Delete Project')).toBeInTheDocument();
    await expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  },
};

export const WarningVariant: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <ConfirmDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Archive Project"
          description="Archiving this project will hide it from your active list. You can restore it later."
          icon={AlertTriangle}
          variant="warning"
          confirmLabel="Archive"
          onConfirm={() => onOpenChange(false)}
        />
      )}
    </DialogWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    await user.click(canvas.getByRole('button', { name: /open dialog/i }));
    await expect(await screen.findByText('Archive Project')).toBeInTheDocument();
  },
};

export const InfoVariant: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <ConfirmDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Mark as Complete"
          description="Mark this project as complete? You can reopen it at any time."
          icon={Info}
          variant="info"
          confirmLabel="Complete"
          onConfirm={() => onOpenChange(false)}
        />
      )}
    </DialogWrapper>
  ),
};

export const Loading: Story = {
  render: () => (
    <ConfirmDialog
      open
      onOpenChange={() => {}}
      title="Deleting..."
      description="Please wait while we delete this project."
      icon={Trash2}
      variant="danger"
      confirmLabel="Delete"
      destructive
      isLoading
      onConfirm={() => {}}
    />
  ),
  play: async () => {
    await expect(await screen.findByRole('button', { name: /delete\.\.\./i })).toBeDisabled();
  },
};

export const OpenByDefault: Story = {
  render: () => (
    <ConfirmDialog
      open
      onOpenChange={() => {}}
      title="Delete Project"
      description="This action cannot be undone."
      icon={Trash2}
      variant="danger"
      confirmLabel="Delete"
      destructive
      onConfirm={() => {}}
    />
  ),
  play: async () => {
    await expect(await screen.findByText('Delete Project')).toBeInTheDocument();
    await expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  },
};
