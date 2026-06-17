import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { disabled: { control: 'boolean' }, placeholder: { control: 'text' } },
  args: { placeholder: 'Add details…' },
  decorators: [Story => <div className="w-80">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ta = canvas.getByPlaceholderText('Add details…');
    await userEvent.type(ta, 'line one');
    await expect(ta).toHaveValue('line one');
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'Cannot edit' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue('Cannot edit')).toBeDisabled();
  },
};
