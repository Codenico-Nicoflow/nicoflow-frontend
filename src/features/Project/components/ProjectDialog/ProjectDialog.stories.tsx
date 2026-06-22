import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, screen } from 'storybook/test';

import { makeArea } from '@/mocks/handlers';
import { mockProject } from '@/stories/mocks';

import { ProjectDialog } from '.';

const areasHandler = http.get('http://localhost:8080/v1/areas', () =>
  HttpResponse.json({
    data: {
      items: [makeArea({ id: 'area-1', name: 'Work' }), makeArea({ id: 'area-2', name: 'Personal' })],
      nextCursor: '',
    },
    error: null,
  })
);

const meta: Meta<typeof ProjectDialog> = {
  title: 'Project/ProjectDialog',
  component: ProjectDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', msw: { handlers: [areasHandler] } },
  args: { open: true, onOpenChange: () => {} },
};
export default meta;

type Story = StoryObj<typeof ProjectDialog>;

export const Create: Story = {
  play: async () => {
    await expect(await screen.findByText('Create New Project')).toBeInTheDocument();
  },
};

export const Edit: Story = {
  args: { project: mockProject({ name: 'Website Redesign' }) },
  play: async () => {
    await expect(await screen.findByText('Edit Project')).toBeInTheDocument();
    await expect(screen.getByDisplayValue('Website Redesign')).toBeInTheDocument();
  },
};

export const NoAreasYet: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('http://localhost:8080/v1/areas', () =>
          HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null })
        ),
      ],
    },
  },
  play: async () => {
    await expect(await screen.findByText('Create New Project')).toBeInTheDocument();
  },
};
