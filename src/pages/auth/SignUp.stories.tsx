import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from 'storybook/test';

import SignUp from './SignUp';

const meta: Meta<typeof SignUp> = {
  title: 'Auth/Pages/SignUp',
  component: SignUp,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof SignUp>;

export const Default: Story = {};

// Typing a password reveals the strength meter (aria-live region).
export const WithPasswordStrength: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText('••••••••'), 'Secret123');
  },
};
