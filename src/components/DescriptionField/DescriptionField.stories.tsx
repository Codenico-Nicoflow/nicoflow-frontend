import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, userEvent, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { DescriptionField } from '.';

type DescriptionForm = { description: string };

type StoryArgs = {
  value: string;
  label: string;
  placeholder: string;
  minHeight: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/DescriptionField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    value: '',
    label: 'Description',
    placeholder: 'Describe this project...',
    minHeight: '100px',
    optional: false,
    delay: 0.15,
  },
  argTypes: {
    value: { control: 'text', description: 'Seeds the form value.' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    minHeight: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<DescriptionForm>({ defaultValues: { description: value } });
      return (
        <Form {...form}>
          <form className="w-[400px]">
            <DescriptionField control={form.control} {...props} />
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
    const textarea = canvas.getByPlaceholderText(/describe this project/i);
    await userEvent.type(textarea, 'A well-organized productivity project.');
    await expect(canvas.getByDisplayValue('A well-organized productivity project.')).toBeInTheDocument();
  },
};

export const WithValue: Story = {
  args: { value: 'Manage all frontend tasks for Q2 release.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue('Manage all frontend tasks for Q2 release.')).toBeInTheDocument();
  },
};

export const Optional: Story = { args: { optional: true, placeholder: 'Optional description...' } };

export const CustomMinHeight: Story = {
  args: { label: 'Notes', placeholder: 'Add detailed notes...', minHeight: '200px' },
};
