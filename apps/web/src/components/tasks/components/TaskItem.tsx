import { useMemo } from 'react';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

import { type ITask, type TaskPriority, TaskStatus } from '@my-monorepo/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { getTaskUrgency, getUrgencyStyles } from '../utils/taskUtils';

import TaskActions from './TaskActions';

interface TaskItemProps {
  task: ITask;
  index: number;
  onTaskToggle: (taskId: number) => void;
  onTaskEdit: (task: ITask) => void;
  onTaskDelete: (taskId: number) => void;
  onTaskPriorityChange: (taskId: number, priority: TaskPriority) => void;
}

const TaskItem = ({ task, index, onTaskToggle, onTaskEdit, onTaskDelete }: TaskItemProps) => {
  const urgency = getTaskUrgency(task);
  const isCompleted = task.status === TaskStatus.DONE;
  const urgencyStyles = useMemo(() => getUrgencyStyles(urgency), [urgency]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      whileHover={{ y: -1 }}
    >
      <Card
        className={cn(
          'transition-all duration-200 border-l-4 border-0',
          'hover:shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm',
          urgencyStyles
        )}
      >
        <CardContent>
          <div className="flex items-center justify-between px-4">
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3
                  className={cn(
                    'font-medium text-slate-900 dark:text-slate-100 leading-tight',
                    isCompleted && 'line-through text-slate-500 dark:text-slate-400'
                  )}
                >
                  {task.name}
                </h3>

                <TaskActions task={task} onEdit={onTaskEdit} onDelete={onTaskDelete} />
              </div>

              {task.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {task.description}
                </p>
              )}

              {task.dueDate && (
                <Badge variant="outline" className={cn('text-xs font-medium')}>
                  {task.dueDate}
                  <Clock className="h-3 w-3 mr-1.5" />
                </Badge>
              )}
            </div>
            <Checkbox
              className="scale-200 hover:scale-230 cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
              onClick={() => onTaskToggle(task.id)}
              value={task.id}
              checked={isCompleted}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TaskItem;
