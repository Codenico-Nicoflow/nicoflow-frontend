import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, screen } from 'storybook/test';

import { makeSubtask, mockTask } from '@/stories/mocks';

import TaskDialog from './TaskDialog';

const API = 'http://localhost:8080/v1';

const meta: Meta<typeof TaskDialog> = {
  title: 'Tasks/TaskDialog',
  component: TaskDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: () => {}, projectId: 'project-1' },
};
export default meta;

type Story = StoryObj<typeof TaskDialog>;

export const Create: Story = {
  play: async () => {
    await expect(await screen.findByText('Create New Task')).toBeInTheDocument();
    await expect(screen.getByTestId('energy-group')).toBeInTheDocument();
    await expect(screen.getByTestId('scheduling-block')).toBeInTheDocument();
  },
};

export const Edit: Story = {
  args: { task: mockTask({ id: 'task-9', title: 'Write the spec', energy: 'deep' }) },
  parameters: {
    msw: {
      handlers: [
        http.get(`${API}/tasks/task-9/subtasks`, () =>
          HttpResponse.json({
            data: { items: [makeSubtask({ id: 'sub-1', taskId: 'task-9', title: 'Draft outline' })] },
            error: null,
          })
        ),
      ],
    },
  },
  play: async () => {
    await expect(await screen.findByText('Edit Task')).toBeInTheDocument();
    await expect(screen.getByDisplayValue('Write the spec')).toBeInTheDocument();
    await expect(await screen.findByTestId('subtask-accordion')).toBeInTheDocument();
  },
};
