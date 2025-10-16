import { motion } from 'framer-motion';

import { useGetTasksQuery } from '@my-monorepo/store';

import TasksEmptyState from '../states/TasksEmptyState';
import TasksLoadingState from '../states/TasksLoadingState';

import TasksHeader from './TasksHeader';
import TasksList from './TasksList';

interface TasksSectionProps {
  projectId: number;
  onAddTask?: () => void;
}

const TasksSection = ({ projectId, onAddTask }: TasksSectionProps) => {
  const { data: tasks = [], isLoading } = useGetTasksQuery();

  const projectTasks = tasks.filter(task => task.projectId === projectId);

  return (
    <div className="p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-5xl mx-auto"
      >
        <TasksHeader taskCount={projectTasks.length} onAddTask={onAddTask} />

        {isLoading ? (
          <TasksLoadingState />
        ) : projectTasks.length > 0 ? (
          <TasksList
            tasks={projectTasks}
            onTaskToggle={() => {}}
            onTaskEdit={() => {}}
            onTaskDelete={() => {}}
            onTaskPriorityChange={() => {}}
          />
        ) : (
          <TasksEmptyState onAddTask={onAddTask} />
        )}
      </motion.div>
    </div>
  );
};

export default TasksSection;
