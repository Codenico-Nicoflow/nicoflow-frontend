import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Rail } from './index';

const meta: Meta<typeof Rail> = {
  title: 'Navigation/Rail',
  component: Rail,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [Story => <div className="h-[480px]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Rail>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('rail-areas')).toBeInTheDocument();
    await expect(canvas.getByTestId('rail-settings')).toBeInTheDocument();
  },
};
