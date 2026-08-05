import { useEffect, useMemo, useRef, useState } from 'react';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { useDebouncedValue } from '@/hooks';
import { useGetTasksQuery, useReorderTaskMutation } from '@/lib/store';
import type { ITask, TaskEnergy } from '@/lib/types';
import { showErrorToast } from '@/lib/utils';

import { countTasks, defaultTaskFilter, matchesFilter, type TaskFilter } from '../filters';
import TasksEmptyState from '../states/TasksEmptyState';
import TasksLoadingState from '../states/TasksLoadingState';

import SortableTaskItem from './SortableTaskItem';
import TaskDeleteDialog from './TaskDeleteDialog';
import TaskDialog from './TaskDialog';
import TaskFilters from './TaskFilters';
import TaskQuickAdd from './TaskQuickAdd';
import TaskSearch from './TaskSearch';
import TasksHeader from './TasksHeader';

interface TasksSectionProps {
  projectId: string;
  onAddTask?: () => void;
  /** False when a surrounding tab already names this section. */
  showHeading?: boolean;
}

const TasksSection = ({ projectId, onAddTask, showHeading = true }: TasksSectionProps) => {
  const { t } = useTranslation('task');
  // One project-scoped fetch is the source of truth; status/energy/search are
  // applied client-side over the (capped, ≤50) project list so counts stay exact.
  const { data: tasks = [], isLoading: isLoadingTasks } = useGetTasksQuery({ projectId });
  const [reorderTask] = useReorderTaskMutation();

  // Drag starts after 5px of movement so plain clicks on the handle don't lift the row.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; name: string } | null>(null);

  // null = untouched, so the filter follows the default until the user picks one.
  // Derived rather than set from an effect: the list arrives async, and seeding
  // state on arrival would flash All before snapping to Inbox.
  const [pickedFilter, setPickedFilter] = useState<TaskFilter | null>(null);
  const [activeEnergy, setActiveEnergy] = useState<TaskEnergy | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // When navigated from search results, router state carries editTaskId so we
  // auto-open the edit dialog for that task once the tasks list is loaded.
  // Guard on location.key (unique per navigation, stable across re-renders) not
  // the task id — so re-selecting the same task while already on this project
  // page fires a fresh nav and re-opens, instead of being swallowed as a dup.
  const location = useLocation();
  const editTaskIdFromNav = (location.state as { editTaskId?: string } | null)?.editTaskId;
  const handledNavKey = useRef<string | null>(null);

  useEffect(() => {
    if (!editTaskIdFromNav || isLoadingTasks) return;
    if (handledNavKey.current === location.key) return;
    const task = tasks.find(t => t.id === editTaskIdFromNav);
    if (task) {
      handledNavKey.current = location.key;
      setSelectedTask(task);
      setIsTaskDialogOpen(true);
    }
  }, [editTaskIdFromNav, location.key, tasks, isLoadingTasks]);

  const taskCounts = useMemo(() => countTasks(tasks), [tasks]);
  const activeFilter = pickedFilter ?? defaultTaskFilter(taskCounts);

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => matchesFilter(task, activeFilter));

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

  // Dropping on a sibling means "take its position": the backend repacks the
  // project's orders contiguously, the mutation patches caches optimistically.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const target = tasks.find(task => task.id === over.id);
    if (!target) return;
    reorderTask({ id: String(active.id), displayOrder: target.displayOrder })
      .unwrap()
      .catch((error: unknown) => showErrorToast(error, toast));
  };

  return (
    <div className="p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full"
      >
        <TasksHeader taskCount={tasks.length} onAddTask={handleAddTask} showTitle={showHeading} />

        {isLoadingTasks ? (
          <TasksLoadingState />
        ) : tasks.length > 0 ? (
          <>
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <TaskSearch value={searchQuery} onChange={setSearchQuery} className="flex-1" />
                <TaskQuickAdd projectId={projectId} className="mb-0 sm:w-72" />
              </div>
              <TaskFilters
                activeFilter={activeFilter}
                onFilterChange={setPickedFilter}
                activeEnergy={activeEnergy}
                onEnergyChange={setActiveEnergy}
                taskCounts={taskCounts}
              />
            </div>

            {filteredTasks.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 sm:space-y-4">
                    {filteredTasks.map((task, index) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        index={index}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-12 text-muted-foreground" data-testid="task-no-results">
                {debouncedSearch ? t('noResults.search') : t('noResults.filter')}
              </div>
            )}
          </>
        ) : (
          <>
            <TaskQuickAdd projectId={projectId} />
            <TasksEmptyState onAddTask={handleAddTask} />
          </>
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
