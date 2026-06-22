import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import BottomText from './BottomText';

const meta: Meta<typeof BottomText> = {
  title: 'Auth/BottomText',
  component: BottomText,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'radio', options: ['login', 'register'] },
  },
};
export default meta;

type Story = StoryObj<typeof BottomText>;

export const LoginVariant: Story = {
  args: { type: 'login' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/don't have an account/i)).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  },
};

export const RegisterVariant: Story = {
  args: { type: 'register' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/already have an account/i)).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  },
};
