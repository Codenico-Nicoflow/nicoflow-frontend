import { useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { useLoadingOverlay } from '@/components';
import { useGetTasksQuery, useUpdateTaskMutation } from '@/lib/store';
import { type ITask, TaskStatus } from '@/lib/types';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

import TasksEmptyState from '../states/TasksEmptyState';
import TasksLoadingState from '../states/TasksLoadingState';

import TaskDeleteDialog from './TaskDeleteDialog';
import TaskDialog from './TaskDialog';
import TaskFilters from './TaskFilters';
import TaskItem from './TaskItem';
import TaskSearch from './TaskSearch';
import TasksHeader from './TasksHeader';

interface TasksSectionProps {
  projectId: number;
  onAddTask?: () => void;
}

const TasksSection = ({ projectId, onAddTask }: TasksSectionProps) => {
  const { data: tasks = [], isLoading: isLoadingTasks } = useGetTasksQuery();
  const [updateTask] = useUpdateTaskMutation();
  const { show, hide } = useLoadingOverlay();

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<{ id: number; name: string } | null>(null);

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
      filtered = filtered.filter(task => task.name.toLowerCase().includes(query));
    }

    return filtered;
  }, [projectTasks, activeFilter, searchQuery]);

  const handleTaskToggle = async (task: ITask) => {
    try {
      show({ title: 'Updating task...', subtitle: 'Please wait while we update the task' });
      await updateTask({
        id: task.id,
        status: task.status === TaskStatus.DONE ? TaskStatus.ACTIVE : TaskStatus.DONE,
      }).unwrap();
      showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
    } catch (error) {
      showErrorToast(error, toast);
    } finally {
      hide();
    }
  };

  const handleAddTask = () => {
    setSelectedTask(undefined);
    setIsTaskDialogOpen(true);
    onAddTask?.();
  };

  const handleEditTask = (task: ITask) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTaskToDelete({ id: taskId, name: task.name });
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
                    onTaskToggle={handleTaskToggle}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No tasks match the selected {searchQuery ? 'search' : 'filter'}.
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
