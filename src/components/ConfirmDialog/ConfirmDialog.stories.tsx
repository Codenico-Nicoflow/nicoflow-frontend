import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { ConfirmDialog } from '.';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/Dialogs/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
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
};
