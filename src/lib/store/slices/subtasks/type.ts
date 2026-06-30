import type { ISubtask } from '@/lib/types';

/* Subtask API */
export type GetSubtasksRequest = string; // taskId
export type GetSubtasksResponse = ISubtask[];

export type CreateSubtaskRequest = {
  taskId: string;
  title: string;
  position?: number;
};
export type CreateSubtaskResponse = ISubtask;

export type UpdateSubtaskRequest = {
  taskId: string;
  id: string;
  title?: string;
  done?: boolean;
  position?: number;
};
export type UpdateSubtaskResponse = ISubtask;

export type DeleteSubtaskRequest = { taskId: string; id: string };
export type DeleteSubtaskResponse = void;
