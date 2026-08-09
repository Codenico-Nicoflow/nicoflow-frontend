import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { StatusField } from '.';

type StatusForm = { status: 'active' | 'done' | 'cancelled' };

type StoryArgs = {
  value: StatusForm['status'];
  label?: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/StatusField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: 'active', label: 'Status', optional: false, delay: 0.2 },
  argTypes: {
    value: {
      control: 'select',
      options: ['active', 'done', 'cancelled'],
      description: 'Seeds the form value.',
    },
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<StatusForm>({ defaultValues: { status: value } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <StatusField control={form.control} {...props} />
          </form>
        </Form>
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Active: Story = {
  args: { value: 'active' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/active/i);
  },
};

export const Done: Story = { args: { value: 'done' } };

export const Cancelled: Story = { args: { value: 'cancelled' } };

export const NoLabel: Story = { args: { label: '' } };
