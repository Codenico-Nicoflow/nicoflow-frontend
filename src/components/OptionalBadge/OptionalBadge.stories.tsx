import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { OptionalBadge } from '.';

const meta: Meta<typeof OptionalBadge> = {
  title: 'Components/Fields/OptionalBadge',
  component: OptionalBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof OptionalBadge>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('(Optional)')).toBeInTheDocument();
  },
};
