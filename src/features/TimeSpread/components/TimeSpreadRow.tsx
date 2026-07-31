import { useMemo } from 'react';

import { format } from 'date-fns';
import { CalendarClock, CalendarX, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ItemActionsMenu, ListItemCard } from '@/components';
import { Checkbox } from '@/components/ui/checkbox';
import TaskBadges from '@/features/Tasks/components/TaskBadges';
import { useConfirmComplete } from '@/features/Tasks/useConfirmComplete';
import { useScheduleTaskMutation, useUpdateTaskStatusMutation } from '@/lib/store';
import { type ITask, TaskStatus } from '@/lib/types';
import { ActiveTab } from '@/lib/types/interfaces';
import { cn, showErrorToast } from '@/lib/utils';

interface TimeSpreadRowProps {
  task: ITask;
  activeTab: (typeof ActiveTab)[keyof typeof ActiveTab];
  onEdit: (task: ITask) => void;
}

const TimeSpreadRow = ({ task, activeTab, onEdit }: TimeSpreadRowProps) => {
  const { t } = useTranslation('task');
  const [updateStatus] = useUpdateTaskStatusMutation();
  const [scheduleTask] = useScheduleTaskMutation();
  const { guardComplete, confirmDialog } = useConfirmComplete();
  const isCompleted = task.status === TaskStatus.DONE;

  const shownActions = useMemo(() => {
    const scheduleFor = (offsetDays: number) => {
      const date = new Date();
      date.setDate(date.getDate() + offsetDays);
      return run(scheduleTask({ id: task.id, scheduledFor: format(date, 'yyyy-MM-dd') }).unwrap());
    };

    const unschedule = () => run(scheduleTask({ id: task.id, scheduledFor: null }).unwrap());
    if (activeTab === ActiveTab.TODAY)
      return [
        { label: t('timeSpread.actions.tomorrow'), icon: CalendarClock, onClick: () => void scheduleFor(1) },
        { label: t('timeSpread.actions.remove'), icon: CalendarX, onClick: () => void unschedule() },
      ];
    if (activeTab === ActiveTab.TOMORROW)
      return [
        { label: t('timeSpread.actions.today'), icon: CalendarClock, onClick: () => void scheduleFor(0) },
        { label: t('timeSpread.actions.remove'), icon: CalendarX, onClick: () => void unschedule() },
      ];
    return [
      { label: t('timeSpread.actions.today'), icon: CalendarClock, onClick: () => void scheduleFor(0) },
      { label: t('timeSpread.actions.tomorrow'), icon: CalendarClock, onClick: () => void scheduleFor(1) },
      { label: t('timeSpread.actions.remove'), icon: CalendarX, onClick: () => void unschedule() },
    ];
  }, [activeTab, scheduleTask, t, task.id]);

  const run = async (op: Promise<unknown>) => {
    try {
      await op;
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const toggle = () => {
    const next = isCompleted ? TaskStatus.ACTIVE : TaskStatus.DONE;
    guardComplete(task, next, () => run(updateStatus({ id: task.id, status: next }).unwrap()));
  };

  // The whole card edits the task; the actions menu and checkbox stopPropagation
  // so reschedule/complete keep their own behaviour.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit(task);
    }
  };

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
            <Checkbox
              className="scale-100 sm:scale-125 cursor-pointer transition-all"
              data-testid={`timespread-checkbox-${task.id}`}
              checked={isCompleted}
              onClick={e => {
                e.stopPropagation();
                void toggle();
              }}
            />
          </div>
        </div>
      </ListItemCard>
      {confirmDialog}
    </>
  );
};

export default TimeSpreadRow;
