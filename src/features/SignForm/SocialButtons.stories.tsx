import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import SocialButtons from './SocialButtons';

const meta: Meta<typeof SocialButtons> = {
  title: 'Auth/SocialButtons',
  component: SocialButtons,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof SocialButtons>;

// Social providers are "coming soon" — the buttons render disabled with an
// accessible name that conveys their state.
export const ComingSoon: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const google = canvas.getByRole('button', { name: /continue with google/i });
    await expect(google).toBeDisabled();
    await expect(canvas.getByRole('button', { name: /continue with facebook/i })).toBeDisabled();
  },
};
