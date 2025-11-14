import { Edit, Trash2 } from 'lucide-react';

import { AnimatedListItem } from '@/components/ui/animated-list-item';
import { Checkbox } from '@/components/ui/checkbox';
import { ItemActionsMenu } from '@/components/ui/item-actions-menu';
import { ListItemCard } from '@/components/ui/list-item-card';
import { type ITask, TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

import TaskBadges from './TaskBadges';

interface TaskItemProps {
  task: ITask;
  index: number;
  onTaskToggle: (task: ITask) => void;
  onEdit: (task: ITask) => void;
  onDelete: (taskId: number) => void;
}

const TaskItem = ({ task, index, onTaskToggle, onEdit, onDelete }: TaskItemProps) => {
  const isCompleted = task.status === TaskStatus.DONE;

  return (
    <AnimatedListItem index={index}>
      <ListItemCard variant="default" borderColor="primary">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex-1 w-full space-y-1 sm:space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3
                className={cn(
                  'font-medium text-sm sm:text-base text-foreground dark:text-foreground leading-snug sm:leading-tight',
                  isCompleted && 'line-through text-muted-foreground dark:text-muted-foreground'
                )}
              >
                {task.name}
              </h3>
              <div className="sm:hidden">
                <TaskBadges task={task} />
              </div>
            </div>

            {task.description && (
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground leading-snug sm:leading-relaxed line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="hidden sm:block">
              <TaskBadges task={task} />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <ItemActionsMenu
              actions={[
                {
                  label: 'Edit',
                  icon: Edit,
                  onClick: () => onEdit(task),
                },
                {
                  label: 'Delete',
                  icon: Trash2,
                  onClick: () => onDelete(task.id),
                  destructive: true,
                },
              ]}
            />
            <Checkbox
              className="scale-100 sm:scale-125 hover:scale-110 sm:hover:scale-150 cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
              onClick={e => {
                e.stopPropagation();
                onTaskToggle(task);
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
