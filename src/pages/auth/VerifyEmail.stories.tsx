import type { Meta, StoryObj } from '@storybook/react';
import { reactRouterParameters } from 'storybook-addon-remix-react-router';

import VerifyEmail from './VerifyEmail';

const meta: Meta<typeof VerifyEmail> = {
  title: 'Auth/Pages/VerifyEmail',
  component: VerifyEmail,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof VerifyEmail>;

// With a `?token=`, the page enters the "verifying" state and fires the verify
// mutation (no Storybook network → it stays on the spinner, which is the state
// we want to showcase here).
export const Verifying: Story = {
  parameters: {
    reactRouter: reactRouterParameters({
      location: { searchParams: { token: 'demo-verify-token' } },
    }),
  },
};

// No token → the page shows the error / invalid-link state immediately.
export const MissingToken: Story = {
  parameters: {
    reactRouter: reactRouterParameters({ location: { searchParams: {} } }),
  },
};
