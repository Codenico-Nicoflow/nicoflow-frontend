import { AnimatePresence, motion } from 'framer-motion';

import { type ITask, TaskStatus } from '@my-monorepo/types';

import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import TaskActions from './TaskActions';
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
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
      >
        <Card
          className={cn(
            'transition-all duration-200 border-l-4',
            'hover:shadow-md hover:border-primary/50 bg-background/80 dark:bg-background/80 backdrop-blur-sm cursor-default select-none'
          )}
        >
          <CardContent className="py-.5 px-2.5 sm:py-3 sm:px-4">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="flex-1 w-full space-y-1 sm:space-y-2 min-w-0">
                <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                  <h3
                    className={cn(
                      'font-medium text-sm sm:text-base text-foreground dark:text-foreground leading-snug sm:leading-tight',
                      isCompleted && 'line-through text-muted-foreground dark:text-muted-foreground'
                    )}
                  >
                    {task.name}
                  </h3>
                </div>

                {task.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground leading-snug sm:leading-relaxed line-clamp-2">
                    {task.description}
                  </p>
                )}

                <TaskBadges task={task} />
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <TaskActions task={task} onEdit={onEdit} onDelete={onDelete} />
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
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskItem;
