import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Checkbox } from './checkbox';
import { Label } from './label';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { disabled: { control: 'boolean' } },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('checkbox');
    await expect(box).not.toBeChecked();
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};

export const Checked: Story = {
  render: () => <Checkbox defaultChecked />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('checkbox')).toBeChecked();
  },
};

export const Disabled: Story = {
  render: () => <Checkbox disabled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('checkbox')).toBeDisabled();
  },
};
