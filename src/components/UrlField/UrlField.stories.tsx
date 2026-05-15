import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';
import { StoryFormWrapper } from '@/stories/helpers';

import { UrlField } from '.';

const meta: Meta<typeof UrlField> = {
  title: 'Components/Fields/UrlField',
  component: UrlField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/reference url/i)).toBeInTheDocument();
  },
};

export const WithUrl: Story = {
  render: () => (
    <StoryFormWrapper<UrlForm> defaultValues={{ url: 'https://nicoflow.app' }}>
      {control => <UrlField control={control} label="Reference URL" />}
    </StoryFormWrapper>
  ),
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

export const Optional: Story = {
  render: () => (
    <StoryFormWrapper<UrlForm> defaultValues={{ url: '' }}>
      {control => <UrlField control={control} label="Reference URL" optional />}
    </StoryFormWrapper>
  ),
};
