import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { DueDateField } from '.';

type DueDateForm = { dueDate?: Date };

type StoryArgs = {
  /** ISO date string ('' = no date). */
  value: string;
  label: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/DueDateField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: '', label: 'Due Date', optional: false, delay: 0.15 },
  argTypes: {
    value: { control: 'text', description: "ISO date that seeds the field (e.g. '2026-06-15'); empty = none." },
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<DueDateForm>({ defaultValues: { dueDate: value ? new Date(value) : undefined } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <DueDateField control={form.control} {...props} />
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
    await expect(canvas.getByText(/pick a date/i)).toBeInTheDocument();
  },
};

export const WithDate: Story = {
  args: { value: '2026-06-15' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/june/i)).toBeInTheDocument();
  },
};

export const Optional: Story = { args: { optional: true } };
