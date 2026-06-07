import type { ITask, TaskPriority, TaskStatus } from '@/lib/types';

/* Task API */
export type GetTasksResponse = ITask[];
export type GetTaskResponse = ITask;
export type GetTaskRequest = string;

export type CreateTaskRequest = {
  projectId: string;
  title: string;
  notes?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedMinutes?: number;
  url?: string;
  scheduledFor?: string;
};

export type CreateTaskResponse = ITask;

export type UpdateTaskRequest = {
  id: string;
  title?: string;
  notes?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  url?: string | null;
  scheduledFor?: string | null;
  displayOrder?: number;
  completedAt?: string | null;
};

export type UpdateTaskResponse = ITask;
export type DeleteTaskRequest = string;
export type DeleteTaskResponse = void;
