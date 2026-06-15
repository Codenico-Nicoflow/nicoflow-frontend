import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import SignIn from './SignIn';

// SignIn renders its form against the global store decorator (no live network).
// The email-not-verified resend panel and error toasts are exercised in the
// MSW-backed unit tests (SignIn.test.tsx); here we cover the default layout.
const meta: Meta<typeof SignIn> = {
  title: 'Auth/Pages/SignIn',
  component: SignIn,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof SignIn>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/email/i)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  },
};
