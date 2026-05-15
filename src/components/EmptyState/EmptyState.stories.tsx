import type { Meta, StoryObj } from '@storybook/react';
import { Inbox, Search, Settings } from 'lucide-react';
import { expect, within } from 'storybook/test';

import { Button } from '@/components/ui/button';

import { EmptyState } from '.';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/Presentational/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    className: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: Inbox,
    title: 'No items yet',
    description: 'Get started by creating your first item.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No items yet')).toBeInTheDocument();
    await expect(canvas.getByText('Get started by creating your first item.')).toBeInTheDocument();
  },
};

export const WithAction: Story = {
  args: {
    icon: Inbox,
    title: 'No projects yet',
    description: 'Create a project to start organizing your tasks.',
    action: <Button size="sm">Create Project</Button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /create project/i })).toBeInTheDocument();
  },
};

export const NoDescription: Story = {
  args: {
    icon: Search,
    title: 'No results found',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No results found')).toBeInTheDocument();
  },
};

export const WithDifferentIcon: Story = {
  args: {
    icon: Settings,
    title: 'Nothing configured',
    description: 'Set up your preferences to get started.',
  },
};
