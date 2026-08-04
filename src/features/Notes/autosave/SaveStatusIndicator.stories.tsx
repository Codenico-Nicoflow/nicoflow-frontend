import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { ConflictNotice } from './ConflictNotice';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { SaveStatus } from './types';

const meta: Meta<typeof SaveStatusIndicator> = {
  title: 'Notes/SaveStatusIndicator',
  component: SaveStatusIndicator,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // No MemoryRouter — the router comes from the global preview decorator.
};
export default meta;

type Story = StoryObj<typeof SaveStatusIndicator>;

export const Unsaved: Story = { args: { status: SaveStatus.UNSAVED } };
export const Saving: Story = { args: { status: SaveStatus.SAVING } };
export const Saved: Story = { args: { status: SaveStatus.SAVED } };
export const Error: Story = { args: { status: SaveStatus.ERROR } };

// Idle renders nothing at all: an untouched note shouldn't carry save chrome.
export const Idle: Story = {
  args: { status: SaveStatus.IDLE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <SaveStatusIndicator status={SaveStatus.UNSAVED} />
      <SaveStatusIndicator status={SaveStatus.SAVING} />
      <SaveStatusIndicator status={SaveStatus.SAVED} />
      <SaveStatusIndicator status={SaveStatus.ERROR} />
      <SaveStatusIndicator status={SaveStatus.CONFLICT} />
    </div>
  ),
};

// The terminal state: autosave has stopped and reload is the only way forward.
// There is deliberately no "save anyway" — it would overwrite the other
// session's work with an older document, and there is no undo.
export const Conflict: StoryObj<typeof ConflictNotice> = {
  render: () => (
    <div className="w-[560px]">
      <ConflictNotice onReload={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
  },
};
