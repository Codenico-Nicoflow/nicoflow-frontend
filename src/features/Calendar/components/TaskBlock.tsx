import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import type { BlockLayout } from '../geometry';

interface TaskBlockProps {
  layout: BlockLayout;
  onSelect: (taskId: string) => void;
}

/**
 * One timed task on the grid.
 *
 * An unestimated task is drawn at the rendered default height and marked
 * visually (dashed lower edge, softer fill, no duration label) so the box never
 * implies a duration the user did not set.
 */
const TaskBlock = ({ layout, onSelect }: TaskBlockProps) => {
  const { t } = useTranslation('task');
  const { task, top, height, isUnestimated, column, columns } = layout;

  const width = 100 / columns;

  return (
    <button
      type="button"
      onClick={() => onSelect(task.id)}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        insetInlineStart: `${column * width}%`,
        width: `${width}%`,
      }}
      className={cn(
        'absolute overflow-hidden rounded-md border px-2 py-1 text-start',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isUnestimated
          ? 'border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10'
          : 'border-primary/30 bg-primary/15 hover:bg-primary/25'
      )}
      data-testid={`calendar-block-${task.id}`}
      data-unestimated={isUnestimated || undefined}
      aria-label={
        isUnestimated
          ? t('calendar.blockUnestimatedLabel', { title: task.title, time: task.scheduledTime })
          : t('calendar.blockLabel', {
              title: task.title,
              time: task.scheduledTime,
              minutes: task.estimatedMinutes,
            })
      }
    >
      <span className="block truncate text-xs font-medium text-foreground">{task.title}</span>
      {!isUnestimated && (
        <span className="block truncate text-[11px] text-muted-foreground">
          {task.scheduledTime} · {t('calendar.minutesShort', { minutes: task.estimatedMinutes })}
        </span>
      )}
    </button>
  );
};

export default TaskBlock;
