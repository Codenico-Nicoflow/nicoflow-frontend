import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { PlanLimitAlert } from '.';

const meta: Meta<typeof PlanLimitAlert> = {
  title: 'Components/Presentational/PlanLimitAlert',
  component: PlanLimitAlert,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { message: { control: 'text' } },
  decorators: [Story => <div className="w-[28rem]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof PlanLimitAlert>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Plan limit reached')).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: /upgrade to pro/i })).toBeInTheDocument();
  },
};

export const CustomMessage: Story = {
  args: { message: "You've reached the 3-area limit on the Free plan." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/3-area limit/)).toBeInTheDocument();
  },
};
