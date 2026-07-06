import type { ITask } from '@/lib/types';

import TimeSpreadRow from './TimeSpreadRow';

const TimeSpreadList = ({ tasks }: { tasks: ITask[] }) => (
  <div className="space-y-3 sm:space-y-4">
    {tasks.map(task => (
      <TimeSpreadRow key={task.id} task={task} />
    ))}
  </div>
);

export default TimeSpreadList;
