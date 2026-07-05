import { useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useDebouncedValue } from '@/hooks';
import { useGetTasksQuery } from '@/lib/store';
import { type ITask, type TaskEnergy, TaskStatus } from '@/lib/types';

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
  // One project-scoped fetch is the source of truth; status/energy/search are
  // applied client-side over the (capped, ≤50) project list so counts stay exact.
  const { data: tasks = [], isLoading: isLoadingTasks } = useGetTasksQuery({ projectId });

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; name: string } | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeEnergy, setActiveEnergy] = useState<TaskEnergy | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const taskCounts = useMemo(
    () => ({
      all: tasks.length,
      inbox: tasks.filter(task => task.status === TaskStatus.INBOX).length,
      active: tasks.filter(task => task.status === TaskStatus.ACTIVE).length,
      someday: tasks.filter(task => task.status === TaskStatus.SOMEDAY).length,
      done: tasks.filter(task => task.status === TaskStatus.DONE).length,
      cancelled: tasks.filter(task => task.status === TaskStatus.CANCELLED).length,
    }),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(task => task.status === activeFilter);
    }
    if (activeEnergy !== 'all') {
      filtered = filtered.filter(task => task.energy === activeEnergy);
    }
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        task => task.title.toLowerCase().includes(query) || (task.notes ?? '').toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [tasks, activeFilter, activeEnergy, debouncedSearch]);

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
        <TasksHeader taskCount={tasks.length} onAddTask={handleAddTask} />

        {isLoadingTasks ? (
          <TasksLoadingState />
        ) : tasks.length > 0 ? (
          <>
            <div className="mb-6 space-y-4">
              <TaskSearch value={searchQuery} onChange={setSearchQuery} />
              <TaskFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                activeEnergy={activeEnergy}
                onEnergyChange={setActiveEnergy}
                taskCounts={taskCounts}
              />
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
              <div className="text-center py-12 text-muted-foreground" data-testid="task-no-results">
                {debouncedSearch ? t('noResults.search') : t('noResults.filter')}
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
