import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { UrlField } from '.';

type UrlForm = { url?: string };

type StoryArgs = {
  value: string;
  label: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/UrlField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: '', label: 'Reference URL', optional: false, delay: 0.15 },
  argTypes: {
    value: { control: 'text', description: 'Seeds the form value.' },
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<UrlForm>({ defaultValues: { url: value } });
      return (
        <Form {...form}>
          <form className="w-[400px]">
            <UrlField control={form.control} {...props} />
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
    await expect(canvas.getByLabelText(/reference url/i)).toBeInTheDocument();
  },
};

export const WithUrl: Story = {
  args: { value: 'https://nicoflow.app' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue('https://nicoflow.app')).toBeInTheDocument();
  },
};

export const InvalidUrl: Story = {
  render: () => {
    const Inner = () => {
      const form = useForm<UrlForm>({ defaultValues: { url: 'not-a-url' } });
      React.useEffect(() => {
        form.setError('url', { message: 'Please enter a valid URL' });
      }, [form]);
      return (
        <Form {...form}>
          <form className="w-[400px] space-y-4">
            <UrlField control={form.control} label="Reference URL" />
          </form>
        </Form>
      );
    };
    return <Inner />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Please enter a valid URL')).toBeInTheDocument();
  },
};

export const Optional: Story = { args: { optional: true } };
