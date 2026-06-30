import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { EnergyField } from '.';

type EnergyForm = { energy: 'low' | 'medium' | 'deep' };

type StoryArgs = {
  value: 'low' | 'medium' | 'deep';
  label: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/EnergyField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: 'medium', label: 'Energy', optional: false, delay: 0.15 },
  argTypes: {
    value: { control: 'select', options: ['low', 'medium', 'deep'], description: 'Seeds the form value.' },
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<EnergyForm>({ defaultValues: { energy: value } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <EnergyField control={form.control} {...props} />
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
    await expect(canvas.getByTestId('energy-option-low')).toHaveAttribute('aria-checked', 'true');
  },
};

export const Medium: Story = {
  args: { value: 'medium' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('energy-option-medium')).toHaveAttribute('aria-checked', 'true');
  },
};

export const Deep: Story = {
  args: { value: 'deep' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('energy-option-deep')).toHaveAttribute('aria-checked', 'true');
  },
};

export const Optional: Story = { args: { optional: true } };
