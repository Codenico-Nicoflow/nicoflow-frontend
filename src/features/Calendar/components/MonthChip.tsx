import type { ITask } from '@nicoflow/shared/types';
import { TaskStatus } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface MonthChipProps {
  task: ITask;
  onSelect: (taskId: string) => void;
}

/**
 * One task inside a desktop month cell. A chip carries only what survives a
 * ~150px column: the time (when there is one) and a truncated title. Completed
 * work stays visible — a month must show what actually happened on a day, not
 * only what is left to do.
 */
const MonthChip = ({ task, onSelect }: MonthChipProps) => {
  const { t } = useTranslation('task');
  const isDone = task.status === TaskStatus.DONE;
  // A retired recurring occurrence — reaped as missed, deliberately skipped,
  // or killed by pausing the series. None of these were "crossed off", so
  // styled distinctly from done: muted like done, but no strikethrough.
  const isMissed =
    task.occurrenceStatus === 'missed' || task.occurrenceStatus === 'skipped' || task.occurrenceStatus === 'paused';

  return (
    <button
      type="button"
      // Stops the click from also firing the parent cell's drill-through.
      onClick={event => {
        event.stopPropagation();
        onSelect(task.id);
      }}
      className={cn(
        'flex w-full items-baseline gap-1 rounded px-1 py-0.5 text-start text-[11px] leading-tight',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        isDone && 'text-muted-foreground line-through',
        isMissed && 'text-muted-foreground/70 italic',
        !isDone && !isMissed && 'text-foreground'
      )}
      data-testid={`calendar-month-chip-${task.id}`}
      aria-label={
        task.occurrenceStatus === 'skipped'
          ? t('calendar.chipSkippedLabel', { title: task.title })
          : task.occurrenceStatus === 'paused'
            ? t('calendar.chipPausedLabel', { title: task.title })
            : isMissed
              ? t('calendar.chipMissedLabel', { title: task.title })
              : task.scheduledTime
                ? t('calendar.chipTimedLabel', { title: task.title, time: task.scheduledTime })
                : t('calendar.chipUntimedLabel', { title: task.title })
      }
    >
      {task.scheduledTime && (
        <span className="shrink-0 tabular-nums text-muted-foreground" data-testid={`calendar-chip-time-${task.id}`}>
          {task.scheduledTime}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{task.title}</span>
    </button>
  );
};

export default MonthChip;
