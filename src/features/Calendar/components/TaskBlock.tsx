import { useRef } from 'react';

import { useReducedMotion } from 'framer-motion';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

import { DEFAULT_BLOCK_MINUTES, HOUR_HEIGHT_PX, MIN_BLOCK_MINUTES, MINUTES_PER_DAY, RESIZE_HANDLE_PX } from '../data';
import { toTimeString } from '../dragMath';
import type { BlockLayout } from '../geometry';
import { parseMinutes } from '../geometry';
import type { BlockDragCommit } from '../useBlockDrag';
import { useBlockDrag } from '../useBlockDrag';

interface TaskBlockProps {
  layout: BlockLayout;
  onSelect: (taskId: string) => void;
  /** Absent on a read-only grid (month chips, a locked free plan). */
  onDragCommit?: (taskId: string, commit: BlockDragCommit) => void;
  /**
   * True when this task overlaps a Google event (NIC-1863). Rendered as a
   * left-edge accent only — it must never change the block's box, or the
   * arrival of Google events would reflow the grid.
   */
  hasConflict?: boolean;
  /**
   * Row height actually drawn — varies with the visible-hours window (NIC-1890).
   * The drag maths must use the SAME value the grid rendered, or a gesture
   * converts screen pixels at the wrong scale and lands at the wrong time.
   */
  hourHeight?: number;
}

/**
 * One timed task on the grid.
 *
 * An unestimated task is drawn at the rendered default height and marked
 * visually (dashed lower edge, softer fill, no duration label) so the box never
 * implies a duration the user did not set.
 *
 * Dragging the body moves the task in time; dragging the bottom edge sets its
 * duration. Resize is the only gesture here that writes `estimatedMinutes` —
 * moving a block must never invent a duration for a task that has none.
 */
const TaskBlock = ({ layout, onSelect, onDragCommit, hasConflict, hourHeight = HOUR_HEIGHT_PX }: TaskBlockProps) => {
  const { t } = useTranslation('task');
  const reduce = useReducedMotion();
  const { task, top, height, isUnestimated, column, columns } = layout;
  const isDone = task.status === TaskStatus.DONE;
  // A drag ends with a click event on the same element; without this the block
  // would both reschedule and open the dialog from one gesture.
  const suppressClick = useRef(false);

  const startMinutes = parseMinutes(task.scheduledTime) ?? 0;
  const drawnMinutes = task.estimatedMinutes ?? DEFAULT_BLOCK_MINUTES;

  const { drag, isDragging, handlers } = useBlockDrag({
    startMinutes,
    minutes: drawnMinutes,
    disabled: !onDragCommit,
    hourHeight,
    onCommit: commit => onDragCommit?.(task.id, commit),
    onDragEnd: () => {
      suppressClick.current = true;
    },
  });

  // While dragging the block follows the pointer directly rather than waiting
  // for the server; the committed value re-renders from cache on release.
  const previewTop = drag ? (drag.startMinutes / 60) * hourHeight : top;
  const previewHeight = drag
    ? Math.max(
        (Math.min(drag.minutes, MINUTES_PER_DAY - drag.startMinutes) / 60) * hourHeight,
        // Same minute-based floor `blockGeometry` uses, so the block does not
        // change size the instant a drag ends.
        (MIN_BLOCK_MINUTES / 60) * hourHeight
      )
    : height;

  const width = 100 / columns;

  return (
    <div
      style={{
        top: `${previewTop}px`,
        height: `${previewHeight}px`,
        insetInlineStart: `${column * width}%`,
        width: `${width}%`,
      }}
      className={cn(
        'absolute',
        // The capability is unchanged under reduced motion — only the easing of
        // the settle back to the committed position is dropped.
        !reduce && !isDragging && 'transition-[top,height] duration-150',
        isDragging && 'z-10'
      )}
      data-testid={`calendar-block-wrapper-${task.id}`}
    >
      <button
        type="button"
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          onSelect(task.id);
        }}
        {...(onDragCommit
          ? { ...handlers, onPointerDown: (event: ReactPointerEvent) => handlers.onPointerDown(event, 'move') }
          : {})}
        style={{ touchAction: onDragCommit ? 'pan-y' : undefined }}
        className={cn(
          'h-full w-full overflow-hidden rounded-md border px-2 py-1 text-start',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          onDragCommit && 'cursor-grab',
          isDragging && 'cursor-grabbing shadow-lg ring-2 ring-primary/40',
          isUnestimated
            ? 'border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10'
            : 'border-primary/30 bg-primary/15 hover:bg-primary/25',
          // Done work stays on the grid — the day should show what happened —
          // but recedes so the eye lands on what is still open.
          isDone && 'border-border/50 bg-muted/40 hover:bg-muted/60',
          // Inset ring rather than a border-width change: a thicker border would
          // alter the box and reflow the block when events arrive.
          hasConflict && 'shadow-[inset_3px_0_0_0_hsl(var(--destructive))]'
        )}
        data-conflict={hasConflict || undefined}
        data-testid={`calendar-block-${task.id}`}
        data-unestimated={isUnestimated || undefined}
        data-done={isDone || undefined}
        data-dragging={isDragging || undefined}
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
        <span
          className={cn(
            'block truncate text-xs font-medium',
            isDone ? 'text-muted-foreground line-through' : 'text-foreground'
          )}
        >
          {task.title}
        </span>
        {(!isUnestimated || drag?.mode === 'resize') && (
          <span className="block truncate text-[11px] text-muted-foreground">
            {drag ? toTimeString(drag.startMinutes) : task.scheduledTime} ·{' '}
            {t('calendar.minutesShort', { minutes: drag ? drag.minutes : task.estimatedMinutes })}
          </span>
        )}
      </button>

      {onDragCommit && (
        // Presentational: the keyboard path to both time and duration is
        // TaskDialog (opened with Enter on the block), so the handle itself is
        // not a second tab stop that leads nowhere.
        <div
          {...handlers}
          onPointerDown={(event: ReactPointerEvent) => handlers.onPointerDown(event, 'resize')}
          style={{ height: `${RESIZE_HANDLE_PX}px`, touchAction: 'pan-y' }}
          className="absolute inset-x-0 bottom-0 cursor-ns-resize"
          data-testid={`calendar-resize-${task.id}`}
          aria-hidden
        />
      )}
    </div>
  );
};

export default TaskBlock;
