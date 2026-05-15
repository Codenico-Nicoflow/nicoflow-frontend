import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { Folder } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';
import { StoryFormWrapper } from '@/stories/helpers';

import { NameField } from '.';

const meta: Meta<typeof NameField> = {
  title: 'Components/Fields/NameField',
  component: NameField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/project name/i)).toBeInTheDocument();
  },
};

export const WithValue: Story = {
  render: () => (
    <StoryFormWrapper<NameForm> defaultValues={{ name: 'My Awesome Project' }}>
      {control => (
        <NameField control={control} label="Project Name" icon={Folder} placeholder="Enter project name..." />
      )}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByDisplayValue('My Awesome Project');
    await expect(input).toBeInTheDocument();
  },
};

export const WithError: Story = {
  render: () => {
    const Inner = () => {
      const form = useForm<NameForm>({ defaultValues: { name: '' } });
      React.useEffect(() => {
        form.setError('name', { message: 'Name is required' });
      }, [form]);
      return (
        <Form {...form}>
          <form className="w-[400px] space-y-4">
            <NameField control={form.control} label="Project Name" icon={Folder} placeholder="Enter project name..." />
          </form>
        </Form>
      );
    };
    return <Inner />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Name is required')).toBeInTheDocument();
  },
};

export const Optional: Story = {
  render: () => (
    <StoryFormWrapper<NameForm> defaultValues={{ name: '' }}>
      {control => (
        <NameField control={control} label="Project Name" icon={Folder} placeholder="Enter project name..." optional />
      )}
    </StoryFormWrapper>
  ),
};
