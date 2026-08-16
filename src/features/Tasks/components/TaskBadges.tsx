import { type ITask } from '@nicoflow/shared/types';
import { AlarmClock, Clock, ExternalLink, Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/components/EstimatedTimeField/presets';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { formatTaskGentleDate, formatTaskPriority, getEnergyGlyph } from '../utils';

interface TaskBadgesProps {
  task: ITask;
}

const TaskBadges = ({ task }: TaskBadgesProps) => {
  const { t } = useTranslation(['task', 'common', 'recurrence']);

  const gentleDate = formatTaskGentleDate(task);
  const priorityResult = task.priority ? formatTaskPriority(task.priority) : null;
  const energyGlyph = getEnergyGlyph(task.energy);
  const EnergyIcon = energyGlyph.icon;
  const energyLabel = t(energyGlyph.labelKey);

  const gentleDateLabel = (() => {
    if (!gentleDate) return null;
    switch (gentleDate.kind) {
      case 'scheduledFuture':
      case 'passedNotRolling':
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
        <EnergyIcon className={cn('h-3 w-3 me-1.5', energyGlyph.colorClass)} aria-hidden />
        {energyLabel}
      </Badge>

      {/* Estimated minutes */}
      {task.estimatedMinutes && (
        <Badge variant="secondary" className="text-xs font-medium">
          <Clock className="h-3 w-3 me-1.5" />
          {formatDuration(
            task.estimatedMinutes,
            t('common:fields.estChips.minSuffix'),
            t('common:fields.estChips.hourSuffix')
          )}
        </Badge>
      )}

      {/* Time of day, read-only. Shown on ANY plan: a downgraded user keeps the
          times they set as Pro — stripping them would delete real user data —
          so the label stays and only the ability to change it is gated. */}
      {task.scheduledTime && (
        <Badge variant="outline" className="text-xs font-medium" data-testid={`task-time-${task.id}`}>
          <AlarmClock className="h-3 w-3 me-1.5" aria-hidden />
          {task.scheduledTime}
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

      {/* Repeat marker. Deliberately not the full schedule summary: that needs
          the rule, and fetching one per row would be N+1. The badge says "this
          comes back"; the schedule itself lives in Settings › Repeating tasks. */}
      {task.recurrenceRuleId && (
        <Badge variant="outline" className="text-xs font-medium" data-testid="task-recurring">
          <Repeat className="h-3 w-3 me-1.5" />
          {t('recurrence:badge.repeats')}
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
