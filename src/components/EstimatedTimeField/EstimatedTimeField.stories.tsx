import type { Meta, StoryObj } from '@storybook/react';

import { StoryFormWrapper } from '@/stories/helpers';

import { EstimatedTimeField } from '.';

const meta: Meta<typeof EstimatedTimeField> = {
  title: 'Components/Fields/EstimatedTimeField',
  component: EstimatedTimeField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof EstimatedTimeField>;

type EstimatedTimeForm = { estimatedMinutes?: number };

export const Default: Story = {
  render: () => (
    <StoryFormWrapper<EstimatedTimeForm> defaultValues={{ estimatedMinutes: undefined }}>
      {control => <EstimatedTimeField control={control} label="Estimated Time" />}
    </StoryFormWrapper>
  ),
};

export const WithValue: Story = {
  render: () => (
    <StoryFormWrapper<EstimatedTimeForm> defaultValues={{ estimatedMinutes: 60 }}>
      {control => <EstimatedTimeField control={control} label="Estimated Time" />}
    </StoryFormWrapper>
  ),
};
