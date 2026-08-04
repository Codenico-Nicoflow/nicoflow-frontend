import type { Meta, StoryObj } from '@storybook/react';
import { Bold, Link2Off, Table } from 'lucide-react';
import { expect, userEvent, within } from 'storybook/test';

import { ToolbarButton } from './ToolbarButton';

const meta: Meta<typeof ToolbarButton> = {
  title: 'Notes/ToolbarButton',
  component: ToolbarButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { label: 'Bold', icon: Bold, onClick: () => {} },
};
export default meta;

type Story = StoryObj<typeof ToolbarButton>;

export const Default: Story = {};

export const Active: Story = {
  args: { label: 'Insert table', icon: Table, isActive: true },
};

export const Disabled: Story = {
  args: { label: 'Remove link', icon: Link2Off, disabled: true },
};

// The control is icon-only, so the label has to reach both a screen reader and
// a sighted user who doesn't recognise the glyph.
export const NamedAndDescribedOnHover: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Bold' });

    await step('carries an accessible name', async () => {
      await expect(button).toHaveAccessibleName('Bold');
    });

    await step('reveals a tooltip on hover', async () => {
      await userEvent.hover(button);
      await expect(await within(document.body).findAllByText('Bold')).not.toHaveLength(0);
    });
  },
};

// aria-pressed is what carries toggle state to a screen reader — the background
// tint alone doesn't.
export const ExposesPressedState: Story = {
  args: { isActive: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  },
};
