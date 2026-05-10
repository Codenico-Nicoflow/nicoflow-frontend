import type { Meta, StoryObj } from '@storybook/react';
import { Inbox, Search, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { EmptyState } from '.';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/Presentational/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: Inbox,
    title: 'No items yet',
    description: 'Get started by creating your first item.',
  },
};

export const WithAction: Story = {
  args: {
    icon: Inbox,
    title: 'No projects yet',
    description: 'Create a project to start organizing your tasks.',
    action: <Button size="sm">Create Project</Button>,
  },
};

export const NoDescription: Story = {
  args: {
    icon: Search,
    title: 'No results found',
  },
};

export const WithDifferentIcon: Story = {
  args: {
    icon: Settings,
    title: 'Nothing configured',
    description: 'Set up your preferences to get started.',
  },
};
