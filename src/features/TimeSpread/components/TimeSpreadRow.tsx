import * as React from 'react';
import { useMemo } from 'react';

import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { ActiveTab } from '@nicoflow/shared/types';
import { format } from 'date-fns';
import { CalendarClock, CalendarX, Pencil, SkipForward, Trash2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { TaskCompleteCheckboxHandle } from '@/components';
import { ItemActionsMenu, ListItemCard, TaskCompleteCheckbox } from '@/components';
import { needsCompletionConfirm } from '@/features/Tasks/completionGuard';
import TaskBadges from '@/features/Tasks/components/TaskBadges';
import { useTaskRecurrenceActions } from '@/features/Tasks/hooks/useTaskRecurrenceActions';
import { useConfirmComplete } from '@/features/Tasks/useConfirmComplete';
import { useScheduleTaskMutation, useUpdateTaskStatusMutation } from '@/lib/store';
import { cn, showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

interface TimeSpreadRowProps {
  task: ITask;
  activeTab: (typeof ActiveTab)[keyof typeof ActiveTab];
  onEdit: (task: ITask) => void;
  onDelete: (taskId: string) => void;
}

const TimeSpreadRow = ({ task, activeTab, onEdit, onDelete }: TimeSpreadRowProps) => {
  const { t } = useTranslation('task');
  const { t: tRec } = useTranslation('recurrence');
  const [updateStatus] = useUpdateTaskStatusMutation();
  const [scheduleTask] = useScheduleTaskMutation();
  const { guardComplete, confirmDialog } = useConfirmComplete();
  const { isRecurringInstance, skip, endSeries, dialogs: recurrenceDialogs } = useTaskRecurrenceActions(task);
  const checkboxRef = React.useRef<TaskCompleteCheckboxHandle>(null);
  const isCompleted = task.status === TaskStatus.DONE;
  // A done recurring instance cannot be un-completed (TASK_RECURRING_NOT_REVERSIBLE).
  const isRecurringDone = isCompleted && !!task.recurrenceRuleId;

  const shownActions = useMemo(() => {
    const scheduleFor = (offsetDays: number) => {
      const date = new Date();
      date.setDate(date.getDate() + offsetDays);
      return run(scheduleTask({ id: task.id, scheduledFor: format(date, 'yyyy-MM-dd') }).unwrap());
    };

    const unschedule = () => run(scheduleTask({ id: task.id, scheduledFor: null }).unwrap());
    // For recurring instances: replace the single "Delete" item with two specific
    // actions, same as TaskItem (project view). Non-recurring tasks keep plain
    // "Delete" which delegates to the parent's onDelete handler.
    const deleteActions = isRecurringInstance
      ? [
          { label: tRec('actions.skipOccurrence'), icon: SkipForward, onClick: skip },
          { label: tRec('actions.endSeries'), icon: XCircle, onClick: endSeries, destructive: true },
        ]
      : [{ label: t('actions.delete'), icon: Trash2, onClick: () => onDelete(task.id), destructive: true }];
    const scheduleActions =
      activeTab === ActiveTab.TODAY
        ? [
            { label: t('timeSpread.actions.tomorrow'), icon: CalendarClock, onClick: () => void scheduleFor(1) },
            { label: t('timeSpread.actions.remove'), icon: CalendarX, onClick: () => void unschedule() },
          ]
        : activeTab === ActiveTab.TOMORROW
          ? [
              { label: t('timeSpread.actions.today'), icon: CalendarClock, onClick: () => void scheduleFor(0) },
              { label: t('timeSpread.actions.remove'), icon: CalendarX, onClick: () => void unschedule() },
            ]
          : [
              { label: t('timeSpread.actions.today'), icon: CalendarClock, onClick: () => void scheduleFor(0) },
              { label: t('timeSpread.actions.tomorrow'), icon: CalendarClock, onClick: () => void scheduleFor(1) },
              { label: t('timeSpread.actions.remove'), icon: CalendarX, onClick: () => void unschedule() },
            ];

    // Recurring instances cannot be rescheduled via the plain schedule mutation —
    // the backend rejects it with TASK_RECURRING_NOT_RESCHEDULABLE.
    return [...(isRecurringInstance ? [] : scheduleActions), ...deleteActions];
  }, [activeTab, endSeries, isRecurringInstance, onDelete, scheduleTask, skip, t, tRec, task.id]);

  const run = async (op: Promise<unknown>) => {
    try {
      await op;
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const toggle = () => {
    const next = isCompleted ? TaskStatus.ACTIVE : TaskStatus.DONE;
    guardComplete(task, next, async () => {
      checkboxRef.current?.playCompleteAnimation();
      try {
        await updateStatus({ id: task.id, status: next }).unwrap();
        if (next === TaskStatus.DONE) showSuccessToast(ToastMessages.TASK_COMPLETED, toast);
      } catch (error) {
        showErrorToast(error, toast);
      }
    });
  };

  // The whole card edits the task; the actions menu and checkbox stopPropagation
  // so reschedule/complete keep their own behaviour.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit(task);
    }
  };

  // Gate fires only on completing with open subtasks — never on uncompleting.
  const willDefer = needsCompletionConfirm(task, TaskStatus.DONE) && !isCompleted;

  return (
    <>
      <ListItemCard
        variant="default"
        borderColor="primary"
        role="button"
        tabIndex={0}
        aria-label={t('actions.edit')}
        data-testid={`timespread-card-${task.id}`}
        onClick={() => onEdit(task)}
        onKeyDown={handleKeyDown}
        className="group cursor-pointer hover:bg-accent/40 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <div className={cn('flex items-center gap-2 sm:gap-3', isCompleted && 'opacity-60 transition-opacity')}>
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
            <h3
              className={cn(
                'font-medium text-sm sm:text-base text-foreground leading-snug',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h3>
            <TaskBadges task={task} />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              aria-label={t('actions.edit')}
              data-testid={`timespread-edit-${task.id}`}
              onClick={() => onEdit(task)}
              className="hidden rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground cursor-pointer group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
            <ItemActionsMenu actions={shownActions} />
            <TaskCompleteCheckbox
              ref={checkboxRef}
              checked={isCompleted}
              onToggle={toggle}
              deferAnimation={willDefer}
              disabled={isRecurringDone}
              size="sm"
              aria-label={t('actions.complete', { title: task.title })}
              data-testid={`timespread-checkbox-${task.id}`}
            />
          </div>
        </div>
      </ListItemCard>
      {confirmDialog}
      {recurrenceDialogs}
    </>
  );
};

export default TimeSpreadRow;
