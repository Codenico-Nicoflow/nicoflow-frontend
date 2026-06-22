import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { reactRouterParameters } from 'storybook-addon-remix-react-router';

import ResetPassword from './ResetPassword';

const meta: Meta<typeof ResetPassword> = {
  title: 'Auth/Pages/ResetPassword',
  component: ResetPassword,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ResetPassword>;

// Valid link — the `?token=` query param is present, so the form renders.
export const WithToken: Story = {
  parameters: {
    reactRouter: reactRouterParameters({
      location: { searchParams: { token: 'demo-reset-token' } },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Reset form has two password inputs (new + confirm).
    await expect(canvas.getAllByPlaceholderText('••••••••')).toHaveLength(2);
  },
};

// No token in the URL — the page shows the "invalid or expired link" guard.
export const MissingToken: Story = {
  parameters: {
    reactRouter: reactRouterParameters({ location: { searchParams: {} } }),
  },
};
