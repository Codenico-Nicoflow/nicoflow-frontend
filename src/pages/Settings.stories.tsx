import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { makeUser } from '@/mocks/handlers';

import Settings from './Settings';

const meta: Meta<typeof Settings> = {
  title: 'Pages/Settings',
  component: Settings,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    preloadedState: { auth: { user: makeUser({ username: 'nico' }), token: 't', isLoading: false } },
  },
  decorators: [Story => <div className="p-6">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Settings>;

export const FreePlan: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    await expect(canvas.getByText('Upgrade to PRO')).toBeInTheDocument();
  },
};

export const ProPlan: Story = {
  parameters: {
    preloadedState: {
      auth: { user: makeUser({ username: 'pro', status: 'premium' }), token: 't', isLoading: false },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Pro users don't see the upgrade card.
    await expect(canvas.queryByText('Upgrade to PRO')).not.toBeInTheDocument();
  },
};

export const Dark: Story = { globals: { theme: 'dark' } };
