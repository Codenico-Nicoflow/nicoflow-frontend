import { Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';

import { TaskPriority, TaskStatus } from '@my-monorepo/types';

export const getStatusConfig = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO:
      return {
        label: 'To Do',
        className:
          'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
        icon: Circle,
        color: 'text-slate-600 dark:text-slate-400',
      };
    case TaskStatus.IN_PROGRESS:
      return {
        label: 'In Progress',
        className:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        icon: Clock,
        color: 'text-blue-600 dark:text-blue-400',
      };
    case TaskStatus.DONE:
      return {
        label: 'Done',
        className:
          'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
      };
    default:
      return {
        label: status,
        className:
          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700',
        icon: Circle,
        color: 'text-gray-600 dark:text-gray-400',
      };
  }
};

export const getPriorityConfig = (priority?: TaskPriority) => {
  switch (priority) {
    case TaskPriority.HIGH:
      return {
        label: 'High',
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        dotColor: 'bg-red-500',
        ringColor: 'ring-red-500/20',
      };
    case TaskPriority.MEDIUM:
      return {
        label: 'Medium',
        className:
          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        dotColor: 'bg-orange-500',
        ringColor: 'ring-orange-500/20',
      };
    case TaskPriority.LOW:
      return {
        label: 'Low',
        className:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        dotColor: 'bg-blue-500',
        ringColor: 'ring-blue-500/20',
      };
    default:
      return null;
  }
};

export const getDateConfig = (dueDate?: string) => {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const now = new Date();
  const isOverdue = date < now;
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

  const formattedDate = isToday
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    formattedDate,
    isOverdue,
    isToday,
    isTomorrow,
    className: isOverdue
      ? 'text-red-600 dark:text-red-400'
      : isToday
        ? 'text-orange-600 dark:text-orange-400'
        : 'text-slate-600 dark:text-slate-400',
    icon: Calendar,
  };
};
