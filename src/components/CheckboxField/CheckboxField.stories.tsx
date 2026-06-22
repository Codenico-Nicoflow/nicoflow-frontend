import type { Meta, StoryObj } from '@storybook/react';
import { Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { expect, userEvent, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { CheckboxField } from '.';

type FavoriteForm = { isFavorite: boolean };

type StoryArgs = {
  value: boolean;
  label: string;
  description?: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/CheckboxField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: false, label: 'Mark as Favorite', description: '', optional: false, delay: 0.15 },
  argTypes: {
    value: { control: 'boolean', description: 'Seeds the checked state.' },
    label: { control: 'text' },
    description: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<FavoriteForm>({ defaultValues: { isFavorite: value } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <CheckboxField control={form.control} icon={Star} fieldName="isFavorite" {...props} />
          </form>
        </Form>
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Unchecked: Story = {
  args: { value: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};

export const Checked: Story = {
  args: { value: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('checkbox')).toBeChecked();
  },
};

export const WithDescription: Story = {
  args: { description: 'Favorited projects appear at the top of your sidebar.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/favorited projects appear/i)).toBeInTheDocument();
  },
};

export const Optional: Story = { args: { optional: true } };
