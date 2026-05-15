import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '@/components/ui/button';

import { CustomDialog } from '.';

const meta: Meta<typeof CustomDialog> = {
  title: 'Components/Dialogs/CustomDialog',
  component: CustomDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof CustomDialog>;

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

export const WithBothButtons: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <CustomDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Confirm Action"
          description="Are you sure you want to proceed with this action?"
          acceptButton={{ text: 'Confirm', onClick: () => onOpenChange(false) }}
          cancelButton={{ text: 'Cancel', onClick: () => onOpenChange(false) }}
        />
      )}
    </DialogWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    await user.click(canvas.getByRole('button', { name: /open dialog/i }));
    await expect(canvas.getByText('Confirm Action')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  },
};

export const TitleOnly: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <CustomDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Information"
          acceptButton={{ text: 'OK', onClick: () => onOpenChange(false) }}
        />
      )}
    </DialogWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    await user.click(canvas.getByRole('button', { name: /open dialog/i }));
    await expect(canvas.getByText('Information')).toBeInTheDocument();
  },
};

export const WithDescription: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <CustomDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Session Expired"
          description="Your session has expired. Please sign in again to continue."
          acceptButton={{ text: 'Sign In', onClick: () => onOpenChange(false) }}
          cancelButton={{ text: 'Dismiss', onClick: () => onOpenChange(false) }}
        />
      )}
    </DialogWrapper>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <CustomDialog
      open
      onOpenChange={() => {}}
      title="Confirm Action"
      description="Are you sure you want to proceed?"
      acceptButton={{ text: 'Confirm', onClick: () => {} }}
      cancelButton={{ text: 'Cancel', onClick: () => {} }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Confirm Action')).toBeInTheDocument();
    await expect(canvas.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  },
};
