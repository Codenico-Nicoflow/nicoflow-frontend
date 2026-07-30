import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { ScheduledTimeField } from '.';

type ScheduledTimeForm = { scheduledTime?: string | null };

type StoryArgs = {
  value?: string | null;
  label: string;
  optional: boolean;
  disabled: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/ScheduledTimeField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: undefined, label: 'Scheduled time', optional: true, disabled: false, delay: 0 },
  argTypes: {
    value: { control: 'text', description: 'Seeds the "HH:MM" value.' },
    label: { control: 'text' },
    optional: { control: 'boolean' },
    disabled: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<ScheduledTimeForm>({ defaultValues: { scheduledTime: value } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <ScheduledTimeField control={form.control} {...props} />
          </form>
        </Form>
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Empty: Story = {};

export const WithTime: Story = {
  args: { value: '09:15' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('scheduled-time-input')).toHaveValue('09:15');
    await expect(canvas.getByTestId('scheduled-time-clear-button')).toBeInTheDocument();
  },
};

export const DisabledUntilDatePicked: Story = {
  args: { value: null, disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('scheduled-time-input')).toBeDisabled();
  },
};
