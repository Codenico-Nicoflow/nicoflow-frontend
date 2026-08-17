import type { AreaWithProjects } from '@nicoflow/shared/api';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { AreaCard } from '.';

const area: AreaWithProjects = {
  id: 'area-1',
  name: 'Work',
  color: '#c4622d',
  icon: 'briefcase',
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  projects: [
    {
      id: 'p1',
      areaId: 'area-1',
      name: 'Redesign',
      status: 'active',
      folderIcon: 'rocket',
      isFavorite: true,
      dueDate: null,
      description: null,
      displayOrder: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p2',
      areaId: 'area-1',
      name: 'Hiring',
      status: 'completed',
      folderIcon: 'user',
      isFavorite: false,
      dueDate: null,
      description: null,
      displayOrder: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
};

const meta: Meta<typeof AreaCard> = {
  title: 'Area/AreaCard',
  component: AreaCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [Story => <div className="w-[360px]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof AreaCard>;

export const WithProjects: Story = {
  args: { area },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Work')).toBeInTheDocument();
    await expect(canvas.getByText('Redesign')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { area: { ...area, projects: [] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/no projects yet/i)).toBeInTheDocument();
  },
};
