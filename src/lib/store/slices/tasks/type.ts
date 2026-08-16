import type { ITask, TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';

/* Task API — list endpoints return { items, nextCursor } inside the data envelope. */
export type GetTasksPage = { items: ITask[]; nextCursor: string };
export type GetTaskResponse = ITask;
export type GetTaskRequest = string;

// Tasks are listed per project: GET /projects/:projectId/tasks with optional
// server-side status/priority/energy/search/sort params (SPEC §3.4). Pagination
// is keyset on (created_at, id) DESC regardless of visible sort; cursor is
// opaque string, empty string means "first page".
export type GetTasksRequest = {
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  energy?: TaskEnergy;
  search?: string;
  sortField?: 'displayOrder' | 'scheduledFor' | 'priority' | 'title' | 'createdAt' | 'energy';
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
  scheduledFor?: string; // soft intention — ISO date "YYYY-MM-DD"
  scheduledTime?: string | null; // "HH:MM" on a 15-min boundary (E-051, Pro-only to set)
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
  scheduledFor?: string | null;
  scheduledTime?: string | null;
  estimatedMinutes?: number | null;
  url?: string | null;
};

export type UpdateTaskResponse = ITask;
export type DeleteTaskRequest = string;
export type DeleteTaskResponse = void;

// Status-only shorthand (PATCH /tasks/:id/status) — checkbox toggle, move to someday.
export type UpdateTaskStatusRequest = { id: string; status: TaskStatus };
export type UpdateTaskStatusResponse = ITask;

// Manual reap (PATCH /tasks/:id/mark-missed) — same terminal state the overdue
// sweep sets automatically, triggered now instead of at next local midnight.
export type MarkTaskMissedRequest = { id: string };
export type MarkTaskMissedResponse = ITask;

// Single-task reorder (PATCH /tasks/:id/reorder) — the backend repacks siblings
// so displayOrder stays contiguous within the project.
export type ReorderTaskRequest = { id: string; displayOrder: number };
export type ReorderTaskResponse = ITask;

// Focus (GET /focus) — deterministically-ranked active+inbox tasks across all
// projects that fit the given time/energy. available 0/omitted = no time budget;
// energy omitted = no preference; limit defaults to 5 (max 20) server-side.
export type GetFocusRequest = {
  available?: number;
  energy?: TaskEnergy;
  limit?: number;
};
export type GetFocusResponse = ITask[];

// Schedule (PATCH /tasks/:id/schedule) — set/clear the soft intention date and
// optionally the roll-forward flag. scheduledFor null clears the schedule.
export type ScheduleTaskRequest = {
  id: string;
  scheduledFor: string | null;
  scheduledTime?: string | null;
  rollsOver?: boolean;
};
export type ScheduleTaskResponse = ITask;

// Calendar range (GET /tasks?scheduledFrom=&scheduledTo=) — flat list of tasks
// scheduled inside an inclusive date window, ordered (scheduledFor,
// scheduledTime NULLS FIRST, displayOrder). Unlike Time Spread NO roll-forward
// is applied: a task comes back on the date it is actually scheduled for, so a
// grid never lies about history. Span is capped at 62 days server-side.
export type GetCalendarTasksRequest = {
  scheduledFrom: string; // inclusive ISO date "YYYY-MM-DD"
  scheduledTo: string; // inclusive ISO date "YYYY-MM-DD"
};
export type GetCalendarTasksResponse = ITask[];

// Time Spread (GET /time-spread) — active+inbox tasks bucketed into the day
// views, with the no-guilt roll-forward already applied server-side. Buckets
// are always present (possibly empty).
export type GetTimeSpreadResponse = {
  today: ITask[];
  tomorrow: ITask[];
  thisWeek: ITask[];
};
