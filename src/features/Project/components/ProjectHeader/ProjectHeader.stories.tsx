import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { mockProject } from '@/stories/mocks';

import { ProjectHeader } from '.';

const meta: Meta<typeof ProjectHeader> = {
  title: 'Project/ProjectHeader',
  component: ProjectHeader,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onEdit: () => {}, onDelete: () => {} },
};
export default meta;

type Story = StoryObj<typeof ProjectHeader>;

export const Active: Story = {
  args: { project: mockProject({ name: 'Website Redesign', isFavorite: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Website Redesign' })).toBeInTheDocument();
  },
};

export const Overdue: Story = {
  args: {
    project: mockProject({
      name: 'Q1 Report',
      status: 'active',
      dueDate: '2020-01-01T00:00:00Z',
      isFavorite: false,
    }),
  },
};

export const Completed: Story = {
  args: { project: mockProject({ name: 'Onboarding flow', status: 'completed' }) },
};
