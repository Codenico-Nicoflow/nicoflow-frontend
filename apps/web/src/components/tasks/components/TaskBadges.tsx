import { Clock, ExternalLink } from 'lucide-react';

import { type ITask } from '@my-monorepo/types';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { formatTaskDueDate, formatTaskPriority } from '../utils';

interface TaskBadgesProps {
  task: ITask;
}

const TaskBadges = ({ task }: TaskBadgesProps) => {
  const formattedDueDate = task.dueDate ? formatTaskDueDate(task.dueDate) : null;
  const formattedPriority = task.priority ? formatTaskPriority(task.priority) : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Estimated Minutes */}
      {task.estimatedMinutes && (
        <Badge variant="secondary" className={cn('text-xs font-medium')}>
          <Clock className="h-3 w-3 mr-1.5" />
          {task.estimatedMinutes} min
        </Badge>
      )}
      {/* Due Date */}
      {task.dueDate && (
        <Badge variant="outline" className={cn('text-xs font-medium', formattedDueDate?.className)}>
          <Clock className="h-3 w-3 mr-1.5" />
          {formattedDueDate?.date}
        </Badge>
      )}

      {/* Priority */}
      {task.priority && (
        <Badge variant="outline" className={cn('text-xs font-medium', formattedPriority?.className)}>
          {formattedPriority?.label}
        </Badge>
      )}

      {/* URL */}
      {task.url && (
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex"
        >
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-medium cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors'
            )}
          >
            <ExternalLink className="h-3 w-3 mr-1.5" />
            Link
          </Badge>
        </a>
      )}
    </div>
  );
};

export default TaskBadges;
