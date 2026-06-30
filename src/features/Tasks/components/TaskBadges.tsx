import { Clock, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { type ITask } from '@/lib/types';
import { cn } from '@/lib/utils';

import { formatTaskGentleDate, formatTaskPriority, getEnergyGlyph } from '../utils';

interface TaskBadgesProps {
  task: ITask;
}

const TaskBadges = ({ task }: TaskBadgesProps) => {
  const { t } = useTranslation(['task', 'common']);

  const gentleDate = formatTaskGentleDate(task);
  const priorityResult = task.priority ? formatTaskPriority(task.priority) : null;
  const energyGlyph = getEnergyGlyph(task.energy);
  const EnergyIcon = energyGlyph.icon;
  const energyLabel = t(energyGlyph.labelKey);

  const gentleDateLabel = (() => {
    if (!gentleDate) return null;
    switch (gentleDate.kind) {
      case 'scheduledFuture':
      case 'dueFuture':
        return gentleDate.formattedDate;
      default:
        return t(`gentleDate.${gentleDate.kind}`);
    }
  })();

  const priorityLabel = priorityResult ? t(`priority.${priorityResult.kind}`) : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Energy glyph */}
      <Badge
        variant="secondary"
        className="text-xs font-medium"
        aria-label={t('energy.aria', { level: energyLabel })}
        data-testid={`task-energy-${task.energy}`}
      >
        <EnergyIcon className="h-3 w-3 me-1.5" aria-hidden />
        {energyLabel}
      </Badge>

      {/* Estimated minutes */}
      {task.estimatedMinutes && (
        <Badge variant="secondary" className="text-xs font-medium">
          <Clock className="h-3 w-3 me-1.5" />
          {t('badges.min', { count: task.estimatedMinutes })}
        </Badge>
      )}

      {/* Gentle date chip — no red overdue; a passed soft date reads "carried over". */}
      {gentleDate && gentleDateLabel && (
        <Badge
          variant="outline"
          className={cn('text-xs font-medium', gentleDate.className)}
          data-testid={`task-date-${gentleDate.kind}`}
        >
          <Clock className="h-3 w-3 me-1.5" />
          {gentleDateLabel}
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
            className="text-xs font-medium cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
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
