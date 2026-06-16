import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { BottomNav } from './index';

const meta: Meta<typeof BottomNav> = {
  title: 'Navigation/BottomNav',
  component: BottomNav,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [Story => <div className="relative h-[120px]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof BottomNav>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('bottomnav-today')).toBeInTheDocument();
    await expect(canvas.getByTestId('bottomnav-areas')).toBeInTheDocument();
  },
};
