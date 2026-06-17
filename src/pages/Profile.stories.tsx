import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import Profile from './Profile';

const meta: Meta<typeof Profile> = {
  title: 'Pages/Profile',
  component: Profile,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Profile>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Profile')).toBeInTheDocument();
  },
};
