import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number'] },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  args: { placeholder: 'Enter text…' },
  decorators: [Story => <div className="w-72">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Enter text…');
    await userEvent.type(input, 'hello');
    await expect(input).toHaveValue('hello');
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'Read only' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue('Read only')).toBeDisabled();
  },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'bad@', placeholder: 'Email' },
};

export const Types: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <Input type="text" placeholder="Text" />
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
    </div>
  ),
};
