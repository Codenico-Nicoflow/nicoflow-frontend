import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { ICON_IDS } from '@/lib/utils';
import { StoryFormWrapper } from '@/stories/helpers';

import { IconField } from '.';

const meta: Meta<typeof IconField> = {
  title: 'Components/Fields/IconField',
  component: IconField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
    fieldName: { control: 'text', options: ICON_IDS },
  },
};
export default meta;

type Story = StoryObj<typeof IconField>;

type IconForm = { icon?: string };

export const Default: Story = {
  render: () => (
    <StoryFormWrapper<IconForm> defaultValues={{ icon: undefined }}>
      {control => <IconField control={control} label="Icon" />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Icon')).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  render: () => (
    <StoryFormWrapper<IconForm> defaultValues={{ icon: 'folder' }}>
      {control => <IconField control={control} label="Icon" />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Select renders the value in the trigger plus a hidden native <option>;
    // assert on the trigger to avoid the duplicate match.
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/folder/i);
  },
};

export const Optional: Story = {
  render: () => (
    <StoryFormWrapper<IconForm> defaultValues={{ icon: undefined }}>
      {control => <IconField control={control} label="Icon" optional />}
    </StoryFormWrapper>
  ),
};
