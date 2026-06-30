import type { ITask, TaskEnergy, TaskPriority, TaskStatus } from '@/lib/types';

/* Task API — list endpoints return { items } inside the data envelope (SPEC §3.4). */
export type GetTasksResponse = ITask[];
export type GetTaskResponse = ITask;
export type GetTaskRequest = string;

export type CreateTaskRequest = {
  projectId: string;
  title: string;
  notes?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  energy?: TaskEnergy;
  rollsOver?: boolean;
  dueDate?: string; // hard deadline — RFC3339 timestamp
  scheduledFor?: string; // soft intention — ISO date "YYYY-MM-DD"
  estimatedMinutes?: number;
  url?: string;
};

export type CreateTaskResponse = ITask;

// completedAt and displayOrder are server-derived (status transition / reorder
// endpoint), so they are not part of the PATCH body.
export type UpdateTaskRequest = {
  id: string;
  title?: string;
  notes?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  energy?: TaskEnergy;
  rollsOver?: boolean;
  dueDate?: string | null;
  scheduledFor?: string | null;
  estimatedMinutes?: number | null;
  url?: string | null;
};

export type UpdateTaskResponse = ITask;
export type DeleteTaskRequest = string;
export type DeleteTaskResponse = void;
