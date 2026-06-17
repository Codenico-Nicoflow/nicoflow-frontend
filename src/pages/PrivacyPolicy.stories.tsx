import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { makeUser } from '@/mocks/handlers';

import PrivacyPolicy from './PrivacyPolicy';

const meta: Meta<typeof PrivacyPolicy> = {
  title: 'Pages/PrivacyPolicy',
  component: PrivacyPolicy,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    preloadedState: { auth: { user: makeUser(), token: 't', isLoading: false } },
  },
};
export default meta;

type Story = StoryObj<typeof PrivacyPolicy>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
  },
};
