import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, userEvent, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { EstimatedTimeField } from '.';

type EstimatedTimeForm = { estimatedMinutes?: number | null };

type StoryArgs = {
  value?: number | null;
  label: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/EstimatedTimeField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: undefined, label: 'Estimated Time', optional: false, delay: 0 },
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
  args: { value: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chip = canvas.getByTestId('chip-60');
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
  },
};

export const PresetSelected: Story = {
  args: { value: 120 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('chip-120')).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByTestId('chip-custom')).toHaveAttribute('aria-pressed', 'false');
  },
};

export const CustomValue: Story = {
  name: 'Custom / off-chip value (47 min)',
  args: { value: 47 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('chip-custom')).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByTestId('estimated-time-input')).toBeInTheDocument();
  },
};

export const Optional: Story = { args: { optional: true } };

export const RTL: Story = {
  name: 'RTL (Hebrew)',
  parameters: { backgrounds: { default: 'light' } },
  decorators: [
    Story => (
      <div dir="rtl" lang="he">
        <Story />
      </div>
    ),
  ],
  args: { value: 30 },
};
