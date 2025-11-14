import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

import { TaskPriority } from '@my-monorepo/types';

export function formatTaskDueDate(dueDate: string): { className: string; date: string } {
  const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;

  if (isToday(date)) {
    return { className: 'text-green-600 bg-green-50 border-green-600', date: 'Today' };
  }

  if (isTomorrow(date)) {
    return { className: 'text-yellow-600 bg-yellow-50 border-yellow-600', date: 'Tomorrow' };
  }

  if (isPast(date) && !isToday(date)) {
    return { className: 'text-red-600 bg-red-50 border-red-600', date: `${format(date, 'MMM d, yyyy')} • Overdue` };
  }
  return { className: 'text-muted-foreground bg-muted border-muted-foreground', date: format(date, 'MMM d, yyyy') };
}

export function formatTaskPriority(priority: TaskPriority): { className: string; label: string } {
  switch (priority) {
    case TaskPriority.LOW:
      return { className: 'text-green-600 bg-green-50 border-green-600', label: 'Low' };
    case TaskPriority.MEDIUM:
      return { className: 'text-yellow-600 bg-yellow-50 border-yellow-600', label: 'Medium' };
    case TaskPriority.HIGH:
      return { className: 'text-red-600 bg-red-50 border-red-600', label: 'High' };
    default:
      return { className: 'text-muted-foreground bg-muted border-muted-foreground', label: 'Unknown' };
  }
}
