import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import HelpAndInformation from './HelpAndInformation';

const meta: Meta<typeof HelpAndInformation> = {
  title: 'Pages/HelpAndInformation',
  component: HelpAndInformation,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof HelpAndInformation>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('HelpAndInformation')).toBeInTheDocument();
  },
};
