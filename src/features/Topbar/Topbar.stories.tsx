import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import i18n from '@/lib/i18n';
import { makeUser } from '@/mocks/handlers';

import { Topbar } from '.';

const meta: Meta<typeof Topbar> = {
  title: 'Navigation/Topbar',
  component: Topbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    preloadedState: { auth: { user: makeUser({ username: 'nico' }), token: 't', isLoading: false } },
  },
};
export default meta;

type Story = StoryObj<typeof Topbar>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(i18n.t('common:appName'))).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: i18n.t('common:actions.search') })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: i18n.t('nav:notifications') })).toBeInTheDocument();
    await expect(canvas.getByTestId('user-menu-trigger')).toBeInTheDocument();
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
};
