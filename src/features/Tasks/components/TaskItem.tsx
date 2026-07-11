import { Edit, Moon, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { AnimatedListItem, ItemActionsMenu, ListItemCard } from '@/components';
import { Checkbox } from '@/components/ui/checkbox';
import { useUpdateTaskStatusMutation } from '@/lib/store';
import { type ITask, TaskStatus } from '@/lib/types';
import { cn, showErrorToast } from '@/lib/utils';

import TaskBadges from './TaskBadges';

interface TaskItemProps {
  task: ITask;
  index: number;
  onEdit: (task: ITask) => void;
  onDelete: (taskId: string) => void;
  /** Optional drag-handle slot rendered at the row start (see SortableTaskItem). */
  dragHandle?: React.ReactNode;
}

const TaskItem = ({ task, index, onEdit, onDelete, dragHandle }: TaskItemProps) => {
  const { t } = useTranslation('task');
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const isCompleted = task.status === TaskStatus.DONE;

  // The checkbox cycles inbox/active → done and back. The mutation is optimistic
  // (see taskApi) so the row flips instantly and rolls back if the request fails.
  const handleToggle = async () => {
    const next = isCompleted ? TaskStatus.ACTIVE : TaskStatus.DONE;
    try {
      await updateTaskStatus({ id: task.id, status: next }).unwrap();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const handleMoveToSomeday = async () => {
    try {
      await updateTaskStatus({ id: task.id, status: TaskStatus.SOMEDAY }).unwrap();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  // The whole card is a shortcut to editing; the checkbox, actions menu, and drag
  // handle stopPropagation so they keep their own behaviour.
  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit(task);
    }
  };

  return (
    <AnimatedListItem index={index}>
      <ListItemCard
        variant="default"
        borderColor="primary"
        role="button"
        tabIndex={0}
        aria-label={t('actions.edit')}
        data-testid={`task-card-${task.id}`}
        onClick={() => onEdit(task)}
        onKeyDown={handleCardKeyDown}
        className="cursor-pointer hover:bg-accent/40 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <div className={cn('flex items-center gap-1.5 sm:gap-3', isCompleted && 'opacity-60 transition-opacity')}>
          {dragHandle}
          <div className="flex-1 w-full space-y-1 sm:space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3
                className={cn(
                  'font-medium text-sm sm:text-base text-foreground dark:text-foreground leading-snug sm:leading-tight',
                  isCompleted && 'line-through text-muted-foreground dark:text-muted-foreground'
                )}
              >
                {task.title}
              </h3>
              <div className="sm:hidden">
                <TaskBadges task={task} />
              </div>
            </div>

            {task.notes && (
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground leading-snug sm:leading-relaxed line-clamp-2">
                {task.notes}
              </p>
            )}

            <div className="hidden sm:block">
              <TaskBadges task={task} />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <ItemActionsMenu
              actions={[
                { label: t('actions.edit'), icon: Edit, onClick: () => onEdit(task) },
                { label: t('actions.moveToSomeday'), icon: Moon, onClick: () => void handleMoveToSomeday() },
                { label: t('actions.delete'), icon: Trash2, onClick: () => onDelete(task.id), destructive: true },
              ]}
            />
            <Checkbox
              className="scale-100 sm:scale-125 hover:scale-110 sm:hover:scale-150 cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
              data-testid={`task-checkbox-${task.id}`}
              onClick={e => {
                e.stopPropagation();
                void handleToggle();
              }}
              value={task.id}
              checked={isCompleted}
            />
          </div>
        </div>
      </ListItemCard>
    </AnimatedListItem>
  );
};

export default TaskItem;
