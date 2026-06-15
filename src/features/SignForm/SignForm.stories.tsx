import type { Meta, StoryObj } from '@storybook/react';
import { MailCheck } from 'lucide-react';
import { expect, within } from 'storybook/test';

import { Button } from '@/components/ui/button';

import SignForm from './SignForm';

const meta: Meta<typeof SignForm> = {
  title: 'Auth/SignForm',
  component: SignForm,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof SignForm>;

export const Default: Story = {
  args: {
    title: 'Welcome back',
    description: 'Sign in to continue to Nicoflow',
    children: <Button className="w-full">Sign in</Button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Check your email',
    description: 'We sent a verification link to you@example.com.',
    icon: <MailCheck className="h-6 w-6 text-primary" />,
    children: <Button className="w-full">Go to sign in</Button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
  },
};
