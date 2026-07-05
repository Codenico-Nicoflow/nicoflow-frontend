import type { ITask, TaskEnergy, TaskPriority, TaskStatus } from '@/lib/types';

/* Task API — list endpoints return { items } inside the data envelope (SPEC §3.4). */
export type GetTasksResponse = ITask[];
export type GetTaskResponse = ITask;
export type GetTaskRequest = string;

// Tasks are listed per project: GET /projects/:projectId/tasks with optional
// server-side status/priority/energy/search/sort params (SPEC §3.4).
export type GetTasksRequest = {
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  energy?: TaskEnergy;
  search?: string;
  sortField?: 'displayOrder' | 'dueDate' | 'priority' | 'title' | 'createdAt' | 'energy';
  sortOrder?: 'asc' | 'desc';
};

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

// Status-only shorthand (PATCH /tasks/:id/status) — checkbox toggle, move to someday.
export type UpdateTaskStatusRequest = { id: string; status: TaskStatus };
export type UpdateTaskStatusResponse = ITask;
