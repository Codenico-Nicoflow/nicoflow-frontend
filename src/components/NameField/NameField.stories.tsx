import type { Meta, StoryObj } from '@storybook/react';
import { Folder } from 'lucide-react';

import { StoryFormWrapper } from '@/stories/helpers';

import { NameField } from '.';

const meta: Meta<typeof NameField> = {
  title: 'Components/Fields/NameField',
  component: NameField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof NameField>;

type NameForm = { name: string };

export const Default: Story = {
  render: () => (
    <StoryFormWrapper<NameForm> defaultValues={{ name: '' }}>
      {control => (
        <NameField control={control} label="Project Name" icon={Folder} placeholder="Enter project name..." />
      )}
    </StoryFormWrapper>
  ),
};

export const WithValue: Story = {
  render: () => (
    <StoryFormWrapper<NameForm> defaultValues={{ name: 'My Awesome Project' }}>
      {control => (
        <NameField control={control} label="Project Name" icon={Folder} placeholder="Enter project name..." />
      )}
    </StoryFormWrapper>
  ),
};
