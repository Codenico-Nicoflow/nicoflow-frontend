import type { Meta, StoryObj } from '@storybook/react';

import { StoryFormWrapper } from '@/stories/helpers';

import { PriorityField } from '.';

const meta: Meta<typeof PriorityField> = {
  title: 'Components/Fields/PriorityField',
  component: PriorityField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
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
};

export const Medium: Story = {
  render: () => (
    <StoryFormWrapper<PriorityForm> defaultValues={{ priority: 'medium' }}>
      {control => <PriorityField control={control} />}
    </StoryFormWrapper>
  ),
};

export const High: Story = {
  render: () => (
    <StoryFormWrapper<PriorityForm> defaultValues={{ priority: 'high' }}>
      {control => <PriorityField control={control} />}
    </StoryFormWrapper>
  ),
};
