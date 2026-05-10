import type { Meta, StoryObj } from '@storybook/react';

import { StoryFormWrapper } from '@/stories/helpers/StoryFormWrapper';

import { DescriptionField } from '.';

const meta: Meta<typeof DescriptionField> = {
  title: 'Components/Fields/DescriptionField',
  component: DescriptionField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof DescriptionField>;

type DescriptionForm = { description: string };

export const Default: Story = {
  render: () => (
    <StoryFormWrapper<DescriptionForm> defaultValues={{ description: '' }}>
      {control => <DescriptionField control={control} label="Description" placeholder="Describe this project..." />}
    </StoryFormWrapper>
  ),
};

export const Optional: Story = {
  render: () => (
    <StoryFormWrapper<DescriptionForm> defaultValues={{ description: '' }}>
      {control => (
        <DescriptionField control={control} label="Description" placeholder="Optional description..." optional />
      )}
    </StoryFormWrapper>
  ),
};

export const CustomMinHeight: Story = {
  render: () => (
    <StoryFormWrapper<DescriptionForm> defaultValues={{ description: '' }}>
      {control => (
        <DescriptionField control={control} label="Notes" placeholder="Add detailed notes..." minHeight="200px" />
      )}
    </StoryFormWrapper>
  ),
};
