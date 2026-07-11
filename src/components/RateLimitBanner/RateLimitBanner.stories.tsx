import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen } from 'storybook/test';

import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import { RateLimitBanner } from '.';

const meta: Meta<typeof RateLimitBanner> = {
  title: 'Components/RateLimitBanner',
  component: RateLimitBanner,
  decorators: [withStoryProviders],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof RateLimitBanner>;

export const Active: Story = {
  parameters: { preloadedState: { rateLimit: { retryAt: Date.now() + 30000 } } },
  play: async () => {
    await expect(await screen.findByTestId('rate-limit-banner')).toBeInTheDocument();
  },
};

export const Idle: Story = {
  parameters: { preloadedState: { rateLimit: { retryAt: null } } },
  play: async () => {
    await expect(screen.queryByTestId('rate-limit-banner')).not.toBeInTheDocument();
  },
};
