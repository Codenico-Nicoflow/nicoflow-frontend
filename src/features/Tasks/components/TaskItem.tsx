import * as React from 'react';

import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { Ban, CalendarX, Edit, SkipForward, Trash2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { TaskCompleteCheckboxHandle } from '@/components';
import { AnimatedListItem, ItemActionsMenu, ListItemCard, TaskCompleteCheckbox } from '@/components';
import { useMarkTaskMissedMutation, useUpdateTaskStatusMutation } from '@/lib/store';
import { cn, showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

import { needsCompletionConfirm } from '../completionGuard';
import { useTaskRecurrenceActions } from '../hooks/useTaskRecurrenceActions';
import { useConfirmComplete } from '../useConfirmComplete';

import TaskBadges from './TaskBadges';

interface TaskItemProps {
  task: ITask;
  index: number;
  onEdit: (task: ITask) => void;
  onDelete: (taskId: string) => void;
  /** Fired when the checkbox flips the status, so a filtered list can keep the row. */
  onStatusToggle?: (taskId: string) => void;
  /** Optional drag-handle slot rendered at the row start (see SortableTaskItem). */
  dragHandle?: React.ReactNode;
}

const TaskItem = ({ task, index, onEdit, onDelete, onStatusToggle, dragHandle }: TaskItemProps) => {
  const { t } = useTranslation('task');
  const { t: tRec } = useTranslation('recurrence');
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [markTaskMissed] = useMarkTaskMissedMutation();
  const { guardComplete, confirmDialog } = useConfirmComplete();
  const { isRecurringInstance, skip, endSeries, dialogs: recurrenceDialogs } = useTaskRecurrenceActions(task);
  const checkboxRef = React.useRef<TaskCompleteCheckboxHandle>(null);
  const isCompleted = task.status === TaskStatus.DONE;
  // A done recurring instance cannot be un-completed (TASK_RECURRING_NOT_REVERSIBLE).
  const isRecurringDone = isCompleted && !!task.recurrenceRuleId;
  // Mirrors the backend's own mark-missed guard (today-or-past, active,
  // recurring, unreaped) so the menu doesn't offer an action the server would
  // reject — the server stays the authority via TASK_NOT_MISSABLE either way.
  const canMarkMissed =
    task.status === TaskStatus.ACTIVE &&
    !!task.recurrenceRuleId &&
    !task.occurrenceStatus &&
    !!task.occurrenceDate &&
    task.occurrenceDate <= new Date().toISOString().slice(0, 10);

  // The checkbox cycles active → done and back. The mutation is optimistic
  // (see taskApi) so the row flips instantly and rolls back if the request fails.
  const handleToggle = () => {
    const next = isCompleted ? TaskStatus.ACTIVE : TaskStatus.DONE;
    guardComplete(task, next, async () => {
      // Announced before awaiting, to match the optimistic flip: a filtered list
      // has to keep the row on the same tick the status changes, or it unmounts
      // before the new state is on screen.
      onStatusToggle?.(task.id);
      // Animation deferred until confirm resolves — play it now alongside the flip.
      checkboxRef.current?.playCompleteAnimation();
      try {
        await updateTaskStatus({ id: task.id, status: next }).unwrap();
        if (next === TaskStatus.DONE) showSuccessToast(ToastMessages.TASK_COMPLETED, toast);
      } catch (error) {
        showErrorToast(error, toast);
      }
    });
  };

  const handleCancel = async () => {
    try {
      await updateTaskStatus({ id: task.id, status: TaskStatus.CANCELLED }).unwrap();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const handleMarkMissed = async () => {
    try {
      await markTaskMissed({ id: task.id }).unwrap();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  // The whole card is a shortcut to editing; the checkbox, actions menu, and drag
  // handle stopPropagation so they keep their own behaviour.
  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit(task);
    }
  };

  // Gate fires only on completing with open subtasks — never on uncompleting.
  const willDefer = needsCompletionConfirm(task, TaskStatus.DONE) && !isCompleted;

  // For recurring instances: replace the single "Delete" item with two specific
  // actions. Non-recurring tasks keep the plain "Delete" which delegates to the
  // parent's onDelete handler (which opens TaskDeleteDialog).
  const deleteActions = isRecurringInstance
    ? [
        {
          label: tRec('actions.skipOccurrence'),
          icon: SkipForward,
          onClick: skip,
        },
        {
          label: tRec('actions.endSeries'),
          icon: XCircle,
          onClick: endSeries,
          destructive: true as const,
        },
      ]
    : [{ label: t('actions.delete'), icon: Trash2, onClick: () => onDelete(task.id), destructive: true as const }];

  return (
    <AnimatedListItem index={index}>
      <ListItemCard
        variant="default"
        borderColor="primary"
        role="button"
        tabIndex={0}
        aria-label={t('actions.edit')}
        data-testid={`task-card-${task.id}`}
        onClick={() => onEdit(task)}
        onKeyDown={handleCardKeyDown}
        className="group cursor-pointer hover:bg-accent/40 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <div className={cn('flex items-center gap-1.5 sm:gap-3', isCompleted && 'opacity-60 transition-opacity')}>
          {dragHandle}
          <div className="flex-1 w-full space-y-1 sm:space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3
                className={cn(
                  'font-medium text-sm sm:text-base text-foreground dark:text-foreground leading-snug sm:leading-tight',
                  isCompleted && 'line-through text-muted-foreground dark:text-muted-foreground'
                )}
              >
                {task.title}
              </h3>
              <div className="sm:hidden">
                <TaskBadges task={task} />
              </div>
            </div>

            {task.notes && (
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground leading-snug sm:leading-relaxed line-clamp-2">
                {task.notes}
              </p>
            )}

            <div className="hidden sm:block">
              <TaskBadges task={task} />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {/* Hover/focus edit shortcut — signals the whole card opens the editor. */}
            <button
              type="button"
              aria-label={t('actions.edit')}
              data-testid={`task-edit-${task.id}`}
              onClick={() => onEdit(task)}
              className="hidden rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground cursor-pointer group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              <Edit className="h-4 w-4" aria-hidden />
            </button>
            <ItemActionsMenu
              actions={[
                { label: t('actions.edit'), icon: Edit, onClick: () => onEdit(task) },
                { label: t('actions.cancel'), icon: Ban, onClick: () => void handleCancel() },
                ...(canMarkMissed
                  ? [{ label: t('actions.markMissed'), icon: CalendarX, onClick: () => void handleMarkMissed() }]
                  : []),
                ...deleteActions,
              ]}
            />
            <TaskCompleteCheckbox
              ref={checkboxRef}
              checked={isCompleted}
              onToggle={handleToggle}
              deferAnimation={willDefer}
              disabled={isRecurringDone}
              size="md"
              aria-label={t('actions.complete', { title: task.title })}
              data-testid={`task-checkbox-${task.id}`}
            />
          </div>
        </div>
      </ListItemCard>
      {confirmDialog}
      {recurrenceDialogs}
    </AnimatedListItem>
  );
};

export default TaskItem;
