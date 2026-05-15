import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { StoryFormWrapper } from '@/stories/helpers';

import { DueDateField } from '.';

const meta: Meta<typeof DueDateField> = {
  title: 'Components/Fields/DueDateField',
  component: DueDateField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
};
export default meta;

type Story = StoryObj<typeof DueDateField>;

type DueDateForm = { dueDate?: Date };

export const Default: Story = {
  render: () => (
    <StoryFormWrapper<DueDateForm> defaultValues={{ dueDate: undefined }}>
      {control => <DueDateField control={control} label="Due Date" />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/pick a date/i)).toBeInTheDocument();
  },
};

export const WithDate: Story = {
  render: () => (
    <StoryFormWrapper<DueDateForm> defaultValues={{ dueDate: new Date('2026-06-15') }}>
      {control => <DueDateField control={control} label="Due Date" />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/june/i)).toBeInTheDocument();
  },
};

export const Optional: Story = {
  render: () => (
    <StoryFormWrapper<DueDateForm> defaultValues={{ dueDate: undefined }}>
      {control => <DueDateField control={control} label="Due Date" optional />}
    </StoryFormWrapper>
  ),
};
