import type { Meta, StoryObj } from '@storybook/react';

import { StoryFormWrapper } from '@/stories/helpers/StoryFormWrapper';

import { IconField } from '.';

const meta: Meta<typeof IconField> = {
  title: 'Components/Fields/IconField',
  component: IconField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
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
};

export const WithIcon: Story = {
  render: () => (
    <StoryFormWrapper<IconForm> defaultValues={{ icon: 'folder' }}>
      {control => <IconField control={control} label="Icon" />}
    </StoryFormWrapper>
  ),
};
