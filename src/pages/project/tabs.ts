export const PROJECT_TAB = {
  TASKS: 'tasks',
  NOTES: 'notes',
} as const;

export type ProjectTab = (typeof PROJECT_TAB)[keyof typeof PROJECT_TAB];

export const PROJECT_TAB_PARAM = 'tab';

// When a task deep-link lands here, this param carries the task id to auto-open.
export const PROJECT_TASK_PARAM = 'task';

// Anything other than a known tab falls back to tasks, so a hand-edited or
// stale ?tab= can't render a project page with no panel at all.
export const parseProjectTab = (value: string | null): ProjectTab =>
  value === PROJECT_TAB.NOTES ? PROJECT_TAB.NOTES : PROJECT_TAB.TASKS;
