import type { ITask } from '@/lib/types';
import { ActiveTab } from '@/lib/types/interfaces';

import TimeSpreadRow from './TimeSpreadRow';

interface Props {
  tasks: ITask[];
  activeTab: (typeof ActiveTab)[keyof typeof ActiveTab];
}

const TimeSpreadList = ({ tasks, activeTab }: Props) => (
  <div className="space-y-3 sm:space-y-4">
    {tasks.map(task => (
      <TimeSpreadRow key={task.id} task={task} activeTab={activeTab} />
    ))}
  </div>
);

export default TimeSpreadList;
