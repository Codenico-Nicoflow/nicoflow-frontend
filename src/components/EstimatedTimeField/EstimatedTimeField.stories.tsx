import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, userEvent, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { EstimatedTimeField } from '.';

type EstimatedTimeForm = { estimatedMinutes?: number };

type StoryArgs = {
  value?: number;
  label: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/EstimatedTimeField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: undefined, label: 'Estimated Time', optional: false, delay: 0.3 },
  argTypes: {
    value: { control: 'number', description: 'Seeds the minutes value.' },
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<EstimatedTimeForm>({ defaultValues: { estimatedMinutes: value } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <EstimatedTimeField control={form.control} {...props} />
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
    const input = canvas.getByRole('spinbutton');
    await userEvent.type(input, '90');
    await expect(canvas.getByDisplayValue('90')).toBeInTheDocument();
  },
};

export const WithValue: Story = {
  args: { value: 60 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue('60')).toBeInTheDocument();
  },
};

export const Optional: Story = { args: { optional: true } };
