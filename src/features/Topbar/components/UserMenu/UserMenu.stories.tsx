import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';

import { makeUser } from '@/mocks/handlers';

import { UserMenu } from '.';

const meta: Meta<typeof UserMenu> = {
  title: 'Navigation/UserMenu',
  component: UserMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    preloadedState: { auth: { user: makeUser({ username: 'nico' }), token: 't', isLoading: false } },
  },
};
export default meta;

type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('user-menu-trigger'));
    // Menu items portal to body; two logout entries exist, target by testid.
    await expect(await screen.findByTestId('user-menu-logout')).toBeInTheDocument();
    await expect(screen.getByTestId('user-menu-logout-all')).toBeInTheDocument();
  },
};

export const PremiumUser: Story = {
  parameters: {
    preloadedState: {
      auth: { user: makeUser({ username: 'pro', status: 'premium' }), token: 't', isLoading: false },
    },
  },
};
