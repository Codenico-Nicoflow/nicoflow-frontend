import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { PriorityField } from '.';

type PriorityForm = { priority: 'low' | 'medium' | 'high' };

type StoryArgs = {
  value: 'low' | 'medium' | 'high';
  label: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/PriorityField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: 'medium', label: 'Priority', optional: false, delay: 0.15 },
  argTypes: {
    value: { control: 'select', options: ['low', 'medium', 'high'], description: 'Seeds the form value.' },
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<PriorityForm>({ defaultValues: { priority: value } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <PriorityField control={form.control} {...props} />
          </form>
        </Form>
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Low: Story = {
  args: { value: 'low' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Radix Select renders the value in the trigger plus a hidden native
    // <option>; assert on the trigger to avoid the duplicate match.
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/low/i);
  },
};

export const Medium: Story = {
  args: { value: 'medium' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/medium/i);
  },
};

export const High: Story = {
  args: { value: 'high' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/high/i);
  },
};

export const Optional: Story = { args: { optional: true } };
