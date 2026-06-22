import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import ErrorPage from './ErrorPage';

const meta: Meta<typeof ErrorPage> = {
  title: 'Pages/ErrorPage',
  component: ErrorPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ErrorPage>;

export const NotFound: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/oops! page not found/i)).toBeInTheDocument();
  },
};

export const Dark: Story = { globals: { theme: 'dark' } };
