import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';
import type { LoginFormData } from '@/lib/utils';

import RememberMe from './RememberMe';

// RememberMe needs a react-hook-form context; this harness supplies one and lets
// each story seed the `remember` default.
const Harness = ({ remember }: { remember: boolean }) => {
  const form = useForm<LoginFormData>({ defaultValues: { identifier: '', password: '', remember } });
  return (
    <Form {...form}>
      <form className="w-[360px]">
        <RememberMe form={form} />
      </form>
    </Form>
  );
};

const meta: Meta<typeof Harness> = {
  title: 'Auth/RememberMe',
  component: Harness,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Harness>;

export const Unchecked: Story = {
  args: { remember: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('checkbox')).not.toBeChecked();
    await expect(canvas.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  },
};

export const Checked: Story = {
  args: { remember: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('checkbox')).toBeChecked();
  },
};
