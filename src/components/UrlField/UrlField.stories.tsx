import type { Meta, StoryObj } from '@storybook/react';

import { StoryFormWrapper } from '@/stories/helpers/StoryFormWrapper';

import { UrlField } from '.';

const meta: Meta<typeof UrlField> = {
  title: 'Components/Fields/UrlField',
  component: UrlField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof UrlField>;

type UrlForm = { url?: string };

export const Default: Story = {
  render: () => (
    <StoryFormWrapper<UrlForm> defaultValues={{ url: '' }}>
      {control => <UrlField control={control} label="Reference URL" />}
    </StoryFormWrapper>
  ),
};

export const WithUrl: Story = {
  render: () => (
    <StoryFormWrapper<UrlForm> defaultValues={{ url: 'https://nicoflow.app' }}>
      {control => <UrlField control={control} label="Reference URL" />}
    </StoryFormWrapper>
  ),
};
