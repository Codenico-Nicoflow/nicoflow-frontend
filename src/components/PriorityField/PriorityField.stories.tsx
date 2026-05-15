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
    await expect(canvas.getByText(/low/i)).toBeInTheDocument();
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
    await expect(canvas.getByText(/medium/i)).toBeInTheDocument();
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
    await expect(canvas.getByText(/high/i)).toBeInTheDocument();
  },
};

export const Optional: Story = {
  render: () => (
    <StoryFormWrapper<PriorityForm> defaultValues={{ priority: 'medium' }}>
      {control => <PriorityField control={control} optional />}
    </StoryFormWrapper>
  ),
};
