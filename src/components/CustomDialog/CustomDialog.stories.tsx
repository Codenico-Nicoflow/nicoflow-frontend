import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen } from 'storybook/test';

import { CustomDialog } from '.';

type StoryArgs = {
  title: string;
  description?: string;
  acceptText: string;
  cancelText?: string;
};

// Renders open so the Controls panel drives the live dialog. Button objects are
// built from the text args.
const meta: Meta<StoryArgs> = {
  title: 'Components/Dialogs/CustomDialog',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed with this action?',
    acceptText: 'Confirm',
    cancelText: 'Cancel',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    acceptText: { control: 'text' },
    cancelText: { control: 'text' },
  },
  render: ({ title, description, acceptText, cancelText }) => (
    <CustomDialog
      open
      onOpenChange={() => {}}
      title={title}
      description={description}
      acceptButton={{ text: acceptText, onClick: () => {} }}
      cancelButton={cancelText ? { text: cancelText, onClick: () => {} } : undefined}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const WithBothButtons: Story = {
  play: async () => {
    await expect(await screen.findByText('Confirm Action')).toBeInTheDocument();
    await expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    await expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  },
};

export const TitleOnly: Story = {
  args: { title: 'Information', description: undefined, acceptText: 'OK', cancelText: undefined },
  play: async () => {
    await expect(await screen.findByText('Information')).toBeInTheDocument();
  },
};

export const SessionExpired: Story = {
  args: {
    title: 'Session Expired',
    description: 'Your session has expired. Please sign in again to continue.',
    acceptText: 'Sign In',
    cancelText: 'Dismiss',
  },
};
