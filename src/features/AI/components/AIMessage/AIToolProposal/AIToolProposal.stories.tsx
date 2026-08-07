import type { Meta, StoryObj } from '@storybook/react';

import { AIToolProposal } from './index';

const meta: Meta<typeof AIToolProposal> = {
  title: 'AI/AIToolProposal',
  component: AIToolProposal,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    onConfirm: () => {},
    onReject: () => {},
    taskTitles: { 'task-1': 'Write PRD', 'task-2': 'Design the hero' },
    projectNames: { 'proj-1': 'Launch Campaign' },
  },
};
export default meta;

type Story = StoryObj<typeof AIToolProposal>;

export const CompleteTaskPending: Story = {
  name: 'complete_task — pending',
  args: {
    toolUseId: 'toolu_001',
    toolName: 'complete_task',
    input: { taskId: 'task-1', reason: 'You confirmed everything in the PR.' },
    status: 'pending_confirm',
  },
};

export const CompleteTaskExecuting: Story = {
  name: 'complete_task — executing',
  args: {
    toolUseId: 'toolu_001',
    toolName: 'complete_task',
    input: { taskId: 'task-1' },
    status: 'executing',
  },
};

export const CompleteTaskDone: Story = {
  name: 'complete_task — done (Applied)',
  args: {
    toolUseId: 'toolu_001',
    toolName: 'complete_task',
    input: { taskId: 'task-1' },
    status: 'done',
  },
};

export const CompleteTaskRejected: Story = {
  name: 'complete_task — rejected',
  args: {
    toolUseId: 'toolu_001',
    toolName: 'complete_task',
    input: { taskId: 'task-1' },
    status: 'rejected',
  },
};

export const CompleteTaskError: Story = {
  name: 'complete_task — error (retriable)',
  args: {
    toolUseId: 'toolu_001',
    toolName: 'complete_task',
    input: { taskId: 'task-1' },
    status: 'error',
    errorMessage: 'Network error — please try again.',
  },
};

export const CompleteTaskAlreadyResolved: Story = {
  name: 'complete_task — already resolved (409)',
  args: {
    toolUseId: 'toolu_001',
    toolName: 'complete_task',
    input: { taskId: 'task-1' },
    status: 'error',
    alreadyResolved: true,
    errorMessage: 'Already resolved',
  },
};

export const RescheduleTaskPending: Story = {
  name: 'reschedule_task — pending',
  args: {
    toolUseId: 'toolu_002',
    toolName: 'reschedule_task',
    input: { taskId: 'task-2', scheduledFor: '2026-08-10', scheduledTime: '09:00', reason: 'You asked to push it.' },
    status: 'pending_confirm',
  },
};

export const RescheduleTaskUnschedule: Story = {
  name: 'reschedule_task — remove schedule',
  args: {
    toolUseId: 'toolu_002',
    toolName: 'reschedule_task',
    input: { taskId: 'task-2', scheduledFor: null },
    status: 'pending_confirm',
  },
};

export const CreateTaskPending: Story = {
  name: 'create_task — pending',
  args: {
    toolUseId: 'toolu_003',
    toolName: 'create_task',
    input: {
      projectId: 'proj-1',
      title: 'Draft outline',
      priority: 'HIGH',
      reason: "You said you'd tackle this today.",
    },
    status: 'pending_confirm',
  },
};

export const CreateTaskDone: Story = {
  name: 'create_task — done',
  args: {
    toolUseId: 'toolu_003',
    toolName: 'create_task',
    input: { projectId: 'proj-1', title: 'Draft outline' },
    status: 'done',
  },
};
