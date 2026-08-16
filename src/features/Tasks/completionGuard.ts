import { type ITask, TaskStatus } from '@nicoflow/shared/types';

/**
 * Whether completing this task should be confirmed first. Only a transition
 * INTO done is guarded — reopening a task, or any other status change, is
 * always free. Kept framework-agnostic for the E-033 shared extraction.
 */
export const needsCompletionConfirm = (task: Pick<ITask, 'openSubtaskCount'>, nextStatus: TaskStatus): boolean =>
  nextStatus === TaskStatus.DONE && (task.openSubtaskCount ?? 0) > 0;
