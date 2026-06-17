import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, screen } from 'storybook/test';

import { makeProject } from '@/mocks/handlers';
import { mockBucket } from '@/stories/mocks';

import { BucketProcessDialog } from '.';

const projectsHandler = (items: ReturnType<typeof makeProject>[]) =>
  http.get('http://localhost:8080/v1/projects', () =>
    HttpResponse.json({ data: { items, nextCursor: '' }, error: null })
  );

const meta: Meta<typeof BucketProcessDialog> = {
  title: 'Bucket/BucketProcessDialog',
  component: BucketProcessDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: () => {}, bucket: mockBucket({ content: 'Write the launch post' }) },
};
export default meta;

type Story = StoryObj<typeof BucketProcessDialog>;

export const WithProjects: Story = {
  parameters: {
    msw: {
      handlers: [
        projectsHandler([makeProject({ id: 'p1', name: 'Marketing' }), makeProject({ id: 'p2', name: 'Engineering' })]),
      ],
    },
  },
  play: async () => {
    await expect(await screen.findByText('Process Bucket Item')).toBeInTheDocument();
    await expect(screen.getByText(/write the launch post/i)).toBeInTheDocument();
  },
};

export const NoProjects: Story = {
  parameters: { msw: { handlers: [projectsHandler([])] } },
  play: async () => {
    await expect(await screen.findByText('Process Bucket Item')).toBeInTheDocument();
    await expect(await screen.findByText(/need to create at least one project/i)).toBeInTheDocument();
  },
};
