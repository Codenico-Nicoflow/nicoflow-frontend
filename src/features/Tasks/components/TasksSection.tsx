import { useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useGetTasksQuery } from '@/lib/store';
import { type ITask, TaskStatus } from '@/lib/types';

import TasksEmptyState from '../states/TasksEmptyState';
import TasksLoadingState from '../states/TasksLoadingState';

import TaskDeleteDialog from './TaskDeleteDialog';
import TaskDialog from './TaskDialog';
import TaskFilters from './TaskFilters';
import TaskItem from './TaskItem';
import TaskSearch from './TaskSearch';
import TasksHeader from './TasksHeader';

interface TasksSectionProps {
  projectId: string;
  onAddTask?: () => void;
}

const TasksSection = ({ projectId, onAddTask }: TasksSectionProps) => {
  const { t } = useTranslation('task');
  const { data: tasks = [], isLoading: isLoadingTasks } = useGetTasksQuery();

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; name: string } | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const projectTasks = tasks.filter(task => task.projectId === projectId);

  const taskCounts = useMemo(
    () => ({
      all: projectTasks.length,
      inbox: projectTasks.filter(t => t.status === TaskStatus.INBOX).length,
      active: projectTasks.filter(t => t.status === TaskStatus.ACTIVE).length,
      done: projectTasks.filter(t => t.status === TaskStatus.DONE).length,
      cancelled: projectTasks.filter(t => t.status === TaskStatus.CANCELLED).length,
    }),
    [projectTasks]
  );

  const filteredTasks = useMemo(() => {
    let filtered = projectTasks;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(task => task.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => task.title.toLowerCase().includes(query));
    }

    return filtered;
  }, [projectTasks, activeFilter, searchQuery]);

  const handleAddTask = () => {
    setSelectedTask(undefined);
    setIsTaskDialogOpen(true);
    onAddTask?.();
  };

  const handleEditTask = (task: ITask) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
      setTaskToDelete({ id: taskId, name: task.title });
      setIsDeleteDialogOpen(true);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-5xl mx-auto"
      >
        <TasksHeader taskCount={projectTasks.length} onAddTask={handleAddTask} />

        {isLoadingTasks ? (
          <TasksLoadingState />
        ) : projectTasks.length > 0 ? (
          <>
            <div className="mb-6 space-y-4">
              <TaskSearch value={searchQuery} onChange={setSearchQuery} />
              <TaskFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} taskCounts={taskCounts} />
            </div>

            {filteredTasks.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filteredTasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? t('noResults.search') : t('noResults.filter')}
              </div>
            )}
          </>
        ) : (
          <TasksEmptyState onAddTask={handleAddTask} />
        )}
      </motion.div>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={selectedTask}
        projectId={projectId}
      />

      {taskToDelete && (
        <TaskDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          taskName={taskToDelete.name}
          taskId={taskToDelete.id}
        />
      )}
    </div>
  );
};

export default TasksSection;
