import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { BucketQuickInput } from '.';

const meta: Meta<typeof BucketQuickInput> = {
  title: 'Bucket/BucketQuickInput',
  component: BucketQuickInput,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { compact: { control: 'boolean' }, placeholder: { control: 'text' } },
  decorators: [Story => <div className="w-[32rem]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof BucketQuickInput>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByPlaceholderText(/capture anything/i);
    await userEvent.type(field, 'Buy groceries');
    await expect(field).toHaveValue('Buy groceries');
  },
};

export const Compact: Story = {
  args: { compact: true, placeholder: 'Quick capture…' },
};
