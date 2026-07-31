import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { BottomNav } from './index';

const meta: Meta<typeof BottomNav> = {
  title: 'Navigation/BottomNav',
  component: BottomNav,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [Story => <div className="relative h-[220px]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof BottomNav>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('bottomnav-today')).toBeInTheDocument();
    await expect(canvas.getByTestId('bottomnav-areas')).toBeInTheDocument();
    await expect(canvas.getByTestId('bottomnav-more')).toBeInTheDocument();
  },
};

export const OverflowOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('bottomnav-more'));

    // The sheet portals to the body, so assert against the document.
    const sheet = within(document.body);
    await expect(await sheet.findByTestId('bottomnav-focus')).toBeInTheDocument();
    await expect(sheet.getByTestId('bottomnav-ai')).toBeInTheDocument();
  },
};
