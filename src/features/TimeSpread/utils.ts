import { addDays, format, isSameDay, parseISO } from 'date-fns';

import type { ITask } from '@/lib/types';

export interface DayGroup {
  /** ISO day key "yyyy-MM-dd" — stable for keys/testids. */
  key: string;
  date: Date;
  tasks: ITask[];
}

// The day a task lands on is its soft scheduledFor. Unscheduled tasks (shouldn't
// appear in the thisWeek bucket) sort to the end.
const taskDate = (task: ITask): Date | null => {
  return task.scheduledFor ? parseISO(task.scheduledFor) : null;
};

// Group the "this week" bucket by calendar day across the next 7 days, dropping
// days with nothing on them (empty days collapsed, per the QA plan). `today` is
// injectable so tests aren't clock-dependent.
export const groupByDay = (tasks: ITask[], today: Date = new Date()): DayGroup[] => {
  const groups: DayGroup[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(today, offset);
    const dayTasks = tasks.filter(task => {
      const d = taskDate(task);
      return d ? isSameDay(d, date) : false;
    });
    if (dayTasks.length > 0) {
      groups.push({ key: format(date, 'yyyy-MM-dd'), date, tasks: dayTasks });
    }
  }
  return groups;
};
