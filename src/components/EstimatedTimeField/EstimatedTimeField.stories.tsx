import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { StoryFormWrapper } from '@/stories/helpers';

import { EstimatedTimeField } from '.';

const meta: Meta<typeof EstimatedTimeField> = {
  title: 'Components/Fields/EstimatedTimeField',
  component: EstimatedTimeField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const input = canvas.getByRole('spinbutton');
    await user.click(input);
    await user.type(input, '90');
    await expect(canvas.getByDisplayValue('90')).toBeInTheDocument();
  },
};

export const WithValue: Story = {
  render: () => (
    <StoryFormWrapper<EstimatedTimeForm> defaultValues={{ estimatedMinutes: 60 }}>
      {control => <EstimatedTimeField control={control} label="Estimated Time" />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue('60')).toBeInTheDocument();
  },
};

export const Optional: Story = {
  render: () => (
    <StoryFormWrapper<EstimatedTimeForm> defaultValues={{ estimatedMinutes: undefined }}>
      {control => <EstimatedTimeField control={control} label="Estimated Time" optional />}
    </StoryFormWrapper>
  ),
};
