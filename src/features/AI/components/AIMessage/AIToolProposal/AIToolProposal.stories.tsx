import type { Meta, StoryObj } from '@storybook/react';

import type { AIToolProposalProps } from './index';
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

export const SetupRecurringTask: Story = {
  name: 'setup_recurring_task — pending',
  args: {
    toolUseId: 'toolu_010',
    toolName: 'setup_recurring_task',
    input: {
      title: 'Daily standup',
      freq: 'daily',
      interval: 1,
      scheduledTime: '09:00',
      reason: 'You asked to make this a habit.',
    },
    status: 'pending_confirm',
  },
};

export const AdjustRecurringTask: Story = {
  name: 'adjust_recurring_task — pending',
  args: {
    toolUseId: 'toolu_011',
    toolName: 'adjust_recurring_task',
    input: { taskId: 'task-1', freq: 'weekly', interval: 2, reason: 'Switching to every other week.' },
    status: 'pending_confirm',
  },
};

export const EndRecurringSeries: Story = {
  name: 'end_recurring_series — pending',
  args: {
    toolUseId: 'toolu_012',
    toolName: 'end_recurring_series',
    input: { taskId: 'task-2', reason: 'Goal achieved, no need to repeat.' },
    status: 'pending_confirm',
  },
};

export const CreateNote: Story = {
  name: 'create_note — pending',
  args: {
    toolUseId: 'toolu_013',
    toolName: 'create_note',
    input: {
      projectId: 'p-1',
      title: 'Meeting notes',
      blocks: [
        { kind: 'heading', text: 'Agenda', level: 1 },
        { kind: 'bulletList', items: ['Discussed roadmap priorities.', 'Assigned action items.'] },
      ],
      reason: 'You asked to jot this down.',
    },
    status: 'pending_confirm',
  },
};

export const CreateProject: Story = {
  name: 'create_project — pending',
  args: {
    toolUseId: 'toolu_014',
    toolName: 'create_project',
    input: {
      name: 'Website redesign',
      description: 'Full visual overhaul.',
      reason: 'You mentioned needing a new project for this.',
    },
    status: 'pending_confirm',
  },
};

export const AddSubtask: Story = {
  name: 'add_subtask — pending',
  args: {
    toolUseId: 'toolu_015',
    toolName: 'add_subtask',
    input: { taskId: 'task-1', title: 'Write acceptance criteria', reason: 'Breaking it down.' },
    status: 'pending_confirm',
  },
};

export const ProcessBucketItem: Story = {
  name: 'process_bucket_item — pending',
  args: {
    toolUseId: 'toolu_016',
    toolName: 'process_bucket_item',
    input: { result: 'task', projectId: 'proj-1', reason: 'Processed as a task in your launch project.' },
    status: 'pending_confirm',
  },
};

export const UnknownTool: Story = {
  name: 'unknown future tool — fallback headline',
  args: {
    toolUseId: 'toolu_999',
    // Type cast simulates a tool name the client doesn't know about yet.
    toolName: 'future_backend_tool' as AIToolProposalProps['toolName'],
    input: { reason: 'Something the backend proposed.' },
    status: 'pending_confirm',
  },
};
