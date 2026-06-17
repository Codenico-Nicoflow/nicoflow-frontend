import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { makeUser } from '@/mocks/handlers';

import TermsOfService from './TermsOfService';

const meta: Meta<typeof TermsOfService> = {
  title: 'Pages/TermsOfService',
  component: TermsOfService,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    preloadedState: { auth: { user: makeUser(), token: 't', isLoading: false } },
  },
};
export default meta;

type Story = StoryObj<typeof TermsOfService>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Terms of Service' })).toBeInTheDocument();
  },
};
