import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import ForgotPassword from './ForgotPassword';

const meta: Meta<typeof ForgotPassword> = {
  title: 'Auth/Pages/ForgotPassword',
  component: ForgotPassword,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ForgotPassword>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/email/i)).toBeInTheDocument();
  },
};
