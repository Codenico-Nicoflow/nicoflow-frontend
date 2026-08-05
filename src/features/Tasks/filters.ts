import { type ITask, TaskStatus } from '@/lib/types';

/** Status filters map 1:1 to TaskStatus; `all` and `unscheduled` are lenses over the same list. */
export const TASK_FILTER = {
  ALL: 'all',
  INBOX: TaskStatus.INBOX,
  UNSCHEDULED: 'unscheduled',
  ACTIVE: TaskStatus.ACTIVE,
  SOMEDAY: TaskStatus.SOMEDAY,
  DONE: TaskStatus.DONE,
  CANCELLED: TaskStatus.CANCELLED,
} as const;

export type TaskFilter = (typeof TASK_FILTER)[keyof typeof TASK_FILTER];

export interface TaskCounts {
  all: number;
  inbox: number;
  unscheduled: number;
  active: number;
  someday: number;
  done: number;
  cancelled: number;
}

/** Render order of the pill row: triage lenses first, closed statuses last. */
export const TASK_FILTER_ORDER: { value: TaskFilter; countKey: keyof TaskCounts }[] = [
  { value: TASK_FILTER.ALL, countKey: 'all' },
  { value: TASK_FILTER.INBOX, countKey: 'inbox' },
  { value: TASK_FILTER.UNSCHEDULED, countKey: 'unscheduled' },
  { value: TASK_FILTER.ACTIVE, countKey: 'active' },
  { value: TASK_FILTER.SOMEDAY, countKey: 'someday' },
  { value: TASK_FILTER.DONE, countKey: 'done' },
  { value: TASK_FILTER.CANCELLED, countKey: 'cancelled' },
];

/**
 * Unscheduled is a worklist of tasks still waiting for a date — a finished task
 * never needs one, so done/cancelled are excluded however old they are.
 */
export const isUnscheduled = (task: ITask): boolean =>
  !task.scheduledFor && task.status !== TaskStatus.DONE && task.status !== TaskStatus.CANCELLED;

export const matchesFilter = (task: ITask, filter: TaskFilter): boolean => {
  if (filter === TASK_FILTER.ALL) return true;
  if (filter === TASK_FILTER.UNSCHEDULED) return isUnscheduled(task);
  return task.status === filter;
};

export const countTasks = (tasks: ITask[]): TaskCounts => ({
  all: tasks.length,
  inbox: tasks.filter(task => task.status === TaskStatus.INBOX).length,
  unscheduled: tasks.filter(isUnscheduled).length,
  active: tasks.filter(task => task.status === TaskStatus.ACTIVE).length,
  someday: tasks.filter(task => task.status === TaskStatus.SOMEDAY).length,
  done: tasks.filter(task => task.status === TaskStatus.DONE).length,
  cancelled: tasks.filter(task => task.status === TaskStatus.CANCELLED).length,
});

/**
 * Open on Inbox — the pile that needs a decision — but fall back to All when the
 * project has none, since an empty filter renders a dimmed tab over an empty body.
 */
export const defaultTaskFilter = (counts: TaskCounts): TaskFilter =>
  counts.inbox > 0 ? TASK_FILTER.INBOX : TASK_FILTER.ALL;
