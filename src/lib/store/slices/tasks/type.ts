import type { ITask } from '@/lib/types';

/* Task API */
export type GetTasksResponse = ITask[];
export type CreateTaskRequest = Partial<ITask>;
export type CreateTaskResponse = ITask;
export type UpdateTaskResponse = ITask;

export type UpdateTaskRequest = Partial<ITask>;
export type DeleteProjectRequest = number;
export type GetTaskRequest = number;
export type GetTaskResponse = ITask;
export type DeleteTaskResponse = { message: string };
