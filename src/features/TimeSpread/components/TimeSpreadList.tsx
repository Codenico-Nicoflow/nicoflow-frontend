import type { ITask } from '@nicoflow/shared/types';
import { ActiveTab } from '@nicoflow/shared/types';

import TimeSpreadRow from './TimeSpreadRow';

interface Props {
  tasks: ITask[];
  activeTab: (typeof ActiveTab)[keyof typeof ActiveTab];
  onEdit: (task: ITask) => void;
}

const TimeSpreadList = ({ tasks, activeTab, onEdit }: Props) => (
  <div className="space-y-3 sm:space-y-4">
    {tasks.map(task => (
      <TimeSpreadRow key={task.id} task={task} activeTab={activeTab} onEdit={onEdit} />
    ))}
  </div>
);

export default TimeSpreadList;
