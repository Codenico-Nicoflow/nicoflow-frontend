import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import type { IProject } from '@/lib/types';

import { ProjectRow } from '.';

const baseProject: IProject = {
  id: 'project-1',
  areaId: 'area-1',
  name: 'Redesign the board',
  status: 'active',
  folderIcon: 'rocket',
  dueDate: null,
  isFavorite: false,
  description: null,
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const meta: Meta<typeof ProjectRow> = {
  title: 'Project/ProjectRow',
  component: ProjectRow,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { onEdit: () => {}, onDelete: () => {} },
  decorators: [Story => <div className="w-[420px]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof ProjectRow>;

export const Default: Story = {
  args: { project: baseProject },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Redesign the board')).toBeInTheDocument();
  },
};

export const Favorite: Story = {
  args: { project: { ...baseProject, isFavorite: true } },
};

export const Overdue: Story = {
  args: { project: { ...baseProject, dueDate: '2020-01-01T00:00:00Z' } },
};

export const Completed: Story = {
  args: { project: { ...baseProject, status: 'completed' } },
};
