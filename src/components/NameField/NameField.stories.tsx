import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { Folder } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { NameField } from '.';

type NameForm = { name: string };

type StoryArgs = {
  value: string;
  label: string;
  placeholder: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/NameField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    value: '',
    label: 'Project Name',
    placeholder: 'Enter project name...',
    optional: false,
    delay: 0.1,
  },
  argTypes: {
    value: { control: 'text', description: 'Seeds the form value.' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<NameForm>({ defaultValues: { name: value } });
      return (
        <Form {...form}>
          <form className="w-[400px]">
            <NameField control={form.control} icon={Folder} {...props} />
          </form>
        </Form>
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/project name/i)).toBeInTheDocument();
  },
};

export const WithValue: Story = {
  args: { value: 'My Awesome Project' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue('My Awesome Project')).toBeInTheDocument();
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

export const Optional: Story = { args: { optional: true } };
