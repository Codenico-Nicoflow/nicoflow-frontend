import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Input } from './input';

const meta: Meta<typeof Form> = {
  title: 'UI/Form',
  component: Form,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Form>;

type Values = { username: string };

const DemoForm = ({ withError = false }: { withError?: boolean }) => {
  const form = useForm<Values>({ defaultValues: { username: '' } });
  if (withError) form.setError('username', { message: 'Username is required' });
  return (
    <Form {...form}>
      <form className="w-72 space-y-2">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="nicoflow" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export const Default: Story = {
  render: () => <DemoForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Username')).toBeInTheDocument();
    await expect(canvas.getByText('This is your public display name.')).toBeInTheDocument();
  },
};

export const WithError: Story = {
  render: () => <DemoForm withError />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Username is required')).toBeInTheDocument();
  },
};
