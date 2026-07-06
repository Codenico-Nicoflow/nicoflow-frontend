import type { ITask } from '@/lib/types';

import TimeSpreadRow from './TimeSpreadRow';

interface TimeSpreadListProps {
  tasks: ITask[];
  /** Index offset so animation stagger stays continuous across day groups. */
  startIndex?: number;
}

const TimeSpreadList = ({ tasks, startIndex = 0 }: TimeSpreadListProps) => (
  <div className="space-y-3 sm:space-y-4">
    {tasks.map((task, index) => (
      <TimeSpreadRow key={task.id} task={task} index={startIndex + index} />
    ))}
  </div>
);

export default TimeSpreadList;
