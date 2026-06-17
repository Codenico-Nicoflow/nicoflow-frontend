import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { StoryFormWrapper } from '@/stories/helpers';

import { PriorityField } from '.';

const meta: Meta<typeof PriorityField> = {
  title: 'Components/Fields/PriorityField',
  component: PriorityField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
};
export default meta;

type Story = StoryObj<typeof PriorityField>;

type PriorityForm = { priority: 'low' | 'medium' | 'high' };

export const Low: Story = {
  render: () => (
    <StoryFormWrapper<PriorityForm> defaultValues={{ priority: 'low' }}>
      {control => <PriorityField control={control} />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Radix Select renders the value in the trigger (combobox) plus a hidden
    // native <option>; assert on the trigger to avoid the duplicate match.
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/low/i);
  },
};

export const Medium: Story = {
  render: () => (
    <StoryFormWrapper<PriorityForm> defaultValues={{ priority: 'medium' }}>
      {control => <PriorityField control={control} />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/medium/i);
  },
};

export const High: Story = {
  render: () => (
    <StoryFormWrapper<PriorityForm> defaultValues={{ priority: 'high' }}>
      {control => <PriorityField control={control} />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/high/i);
  },
};

export const Optional: Story = {
  render: () => (
    <StoryFormWrapper<PriorityForm> defaultValues={{ priority: 'medium' }}>
      {control => <PriorityField control={control} optional />}
    </StoryFormWrapper>
  ),
};
