import type { ITask, TaskPriority } from '@my-monorepo/types';

import TaskItem from './TaskItem';

interface TasksListProps {
  tasks: ITask[];
  onTaskToggle: (taskId: number) => void;
  onTaskEdit: (task: ITask) => void;
  onTaskDelete: (taskId: number) => void;
  onTaskPriorityChange: (taskId: number, priority: TaskPriority) => void;
}

const TasksList = ({ tasks, onTaskToggle, onTaskEdit, onTaskDelete, onTaskPriorityChange }: TasksListProps) => {
  console.log(tasks);
  return (
    <div className="space-y-3 sm:space-y-4">
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          onTaskToggle={onTaskToggle}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onTaskPriorityChange={onTaskPriorityChange}
        />
      ))}
    </div>
  );
};

export default TasksList;
