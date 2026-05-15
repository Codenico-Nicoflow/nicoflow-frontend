import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { StoryFormWrapper } from '@/stories/helpers';

import { DescriptionField } from '.';

const meta: Meta<typeof DescriptionField> = {
  title: 'Components/Fields/DescriptionField',
  component: DescriptionField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    optional: { control: 'boolean' },
    minHeight: { control: 'text' },
    delay: { control: 'number' },
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const textarea = canvas.getByPlaceholderText(/describe this project/i);
    await user.click(textarea);
    await user.type(textarea, 'A well-organized productivity project.');
    await expect(canvas.getByDisplayValue('A well-organized productivity project.')).toBeInTheDocument();
  },
};

export const WithValue: Story = {
  render: () => (
    <StoryFormWrapper<DescriptionForm> defaultValues={{ description: 'Manage all frontend tasks for Q2 release.' }}>
      {control => <DescriptionField control={control} label="Description" placeholder="Describe this project..." />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue('Manage all frontend tasks for Q2 release.')).toBeInTheDocument();
  },
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
