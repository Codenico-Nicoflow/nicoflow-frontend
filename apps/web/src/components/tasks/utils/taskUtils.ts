import { type ITask, TaskStatus } from '@my-monorepo/types';

export const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (minutes?: number) => {
  if (!minutes) return null;

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

export const isOverdue = (dueDate?: string) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export const getTaskProgress = (task: ITask) => {
  switch (task.status) {
    case TaskStatus.TODO:
      return { progress: 0, label: 'Not started' };
    case TaskStatus.IN_PROGRESS:
      return { progress: 50, label: 'In progress' };
    case TaskStatus.DONE:
      return { progress: 100, label: 'Completed' };
    default:
      return { progress: 0, label: 'Unknown' };
  }
};

export const getTaskUrgency = (task: ITask) => {
  const now = new Date();
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  if (!dueDate) return 'none';

  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue === 0) return 'today';
  if (daysUntilDue === 1) return 'tomorrow';
  if (daysUntilDue <= 3) return 'urgent';
  if (daysUntilDue <= 7) return 'soon';

  return 'none';
};

export const getUrgencyStyles = (urgency: string) => {
  switch (urgency) {
    case 'overdue':
      return 'border-l-red-500 bg-red-50/30 dark:bg-red-950/10';
    case 'today':
      return 'border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10';
    case 'tomorrow':
      return 'border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10';
    default:
      return 'border-l-transparent hover:border-l-primary/50';
  }
};
