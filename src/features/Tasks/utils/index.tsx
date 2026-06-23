import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

import { TaskPriority } from '@/lib/types';

export type DueDateResult =
  | { kind: 'today'; className: string }
  | { kind: 'tomorrow'; className: string }
  | { kind: 'overdue'; className: string; formattedDate: string }
  | { kind: 'future'; className: string; formattedDate: string };

export type PriorityResult =
  | { kind: 'low'; className: string }
  | { kind: 'medium'; className: string }
  | { kind: 'high'; className: string }
  | { kind: 'unknown'; className: string };

export function formatTaskDueDate(dueDate: string): DueDateResult {
  const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;

  if (isToday(date)) {
    return { kind: 'today', className: 'text-green-600 bg-green-50 border-green-600' };
  }

  if (isTomorrow(date)) {
    return { kind: 'tomorrow', className: 'text-yellow-600 bg-yellow-50 border-yellow-600' };
  }

  if (isPast(date) && !isToday(date)) {
    return {
      kind: 'overdue',
      className: 'text-red-600 bg-red-50 border-red-600',
      formattedDate: format(date, 'MMM d, yyyy'),
    };
  }

  return {
    kind: 'future',
    className: 'text-muted-foreground bg-muted border-muted-foreground',
    formattedDate: format(date, 'MMM d, yyyy'),
  };
}

export function formatTaskPriority(priority: TaskPriority): PriorityResult {
  switch (priority) {
    case TaskPriority.LOW:
      return { kind: 'low', className: 'text-green-600 bg-green-50 border-green-600' };
    case TaskPriority.MEDIUM:
      return { kind: 'medium', className: 'text-yellow-600 bg-yellow-50 border-yellow-600' };
    case TaskPriority.HIGH:
      return { kind: 'high', className: 'text-red-600 bg-red-50 border-red-600' };
    default:
      return { kind: 'unknown', className: 'text-muted-foreground bg-muted border-muted-foreground' };
  }
}
