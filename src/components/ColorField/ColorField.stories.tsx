import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, screen, userEvent, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { ColorField } from '.';

type ColorForm = { color: string };

// `value` is a story-only arg that seeds the form, so the Controls panel shows
// and edits the current color. The rest are real ColorField props.
type StoryArgs = {
  value: string;
  label?: string;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/ColorField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    value: '#3b82f6',
    label: '',
    delay: 0.15,
  },
  argTypes: {
    value: {
      control: 'select',
      options: [
        '#4f46e5',
        '#3b82f6',
        '#c4622d',
        '#10b981',
        '#8b5cf6',
        '#ec4899',
        '#f59e0b',
        '#ef4444',
        '#14b8a6',
        '#6366f1',
        '#64748b',
      ],
      description: 'Seeds the form value (Indigo, Blue, Ember, …).',
    },
    label: { control: 'text' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<ColorForm>({ defaultValues: { color: value } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <ColorField control={form.control} {...props} />
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
    // Swatch-only trigger; the friendly preset name is the accessible name.
    await expect(canvas.getByTestId('color-trigger')).toHaveAccessibleName('Blue');
  },
};

export const WithLabel: Story = {
  args: { label: 'Area Color' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Area Color')).toBeInTheDocument();
  },
};

export const Indigo: Story = { args: { value: '#4f46e5' } };

export const Ember: Story = { args: { value: '#c4622d' } };

export const PaletteOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('color-trigger'));
    await expect(await screen.findByTestId('color-swatches')).toBeInTheDocument();
  },
};
