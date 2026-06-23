import { Clock, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { type ITask } from '@/lib/types';
import { cn } from '@/lib/utils';

import { formatTaskDueDate, formatTaskPriority } from '../utils';

interface TaskBadgesProps {
  task: ITask;
}

const TaskBadges = ({ task }: TaskBadgesProps) => {
  const { t } = useTranslation('task');

  const dueDateResult = task.dueDate ? formatTaskDueDate(task.dueDate) : null;
  const priorityResult = task.priority ? formatTaskPriority(task.priority) : null;

  const dueDateLabel = (() => {
    if (!dueDateResult) return null;
    switch (dueDateResult.kind) {
      case 'today':
        return t('dueDate.today');
      case 'tomorrow':
        return t('dueDate.tomorrow');
      case 'overdue':
        return t('dueDate.overdue', { date: dueDateResult.formattedDate });
      case 'future':
        return dueDateResult.formattedDate;
    }
  })();

  const priorityLabel = (() => {
    if (!priorityResult) return null;
    return t(`priority.${priorityResult.kind}`);
  })();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Estimated Minutes */}
      {task.estimatedMinutes && (
        <Badge variant="secondary" className={cn('text-xs font-medium')}>
          <Clock className="h-3 w-3 me-1.5" />
          {t('badges.min', { count: task.estimatedMinutes })}
        </Badge>
      )}
      {/* Due Date */}
      {task.dueDate && dueDateResult && (
        <Badge variant="outline" className={cn('text-xs font-medium', dueDateResult.className)}>
          <Clock className="h-3 w-3 me-1.5" />
          {dueDateLabel}
        </Badge>
      )}

      {/* Priority */}
      {task.priority && priorityResult && (
        <Badge variant="outline" className={cn('text-xs font-medium', priorityResult.className)}>
          {priorityLabel}
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
            <ExternalLink className="h-3 w-3 me-1.5" />
            {t('badges.link')}
          </Badge>
        </a>
      )}
    </div>
  );
};

export default TaskBadges;
