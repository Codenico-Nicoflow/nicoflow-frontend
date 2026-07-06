import { format } from 'date-fns';
import { CalendarClock, CalendarX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ItemActionsMenu, ListItemCard } from '@/components';
import { Checkbox } from '@/components/ui/checkbox';
import TaskBadges from '@/features/Tasks/components/TaskBadges';
import { useScheduleTaskMutation, useUpdateTaskStatusMutation } from '@/lib/store';
import { type ITask, TaskStatus } from '@/lib/types';
import { cn, showErrorToast } from '@/lib/utils';

interface TimeSpreadRowProps {
  task: ITask;
}

// A task row in the day views: complete it, or use the schedule quick-actions
// to move it to today / tomorrow / off the schedule. Read-only otherwise —
// editing lives in the project view. Static (no enter animation) so switching
// tabs just swaps content without a re-animating list.
const TimeSpreadRow = ({ task }: TimeSpreadRowProps) => {
  const { t } = useTranslation('task');
  const [updateStatus] = useUpdateTaskStatusMutation();
  const [scheduleTask] = useScheduleTaskMutation();
  const isCompleted = task.status === TaskStatus.DONE;

  const run = async (op: Promise<unknown>) => {
    try {
      await op;
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const toggle = () =>
    run(updateStatus({ id: task.id, status: isCompleted ? TaskStatus.ACTIVE : TaskStatus.DONE }).unwrap());

  const scheduleFor = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return run(scheduleTask({ id: task.id, scheduledFor: format(date, 'yyyy-MM-dd') }).unwrap());
  };

  const unschedule = () => run(scheduleTask({ id: task.id, scheduledFor: null }).unwrap());

  return (
    <ListItemCard variant="default" borderColor="primary">
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

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <ItemActionsMenu
            actions={[
              { label: t('timeSpread.actions.today'), icon: CalendarClock, onClick: () => void scheduleFor(0) },
              { label: t('timeSpread.actions.tomorrow'), icon: CalendarClock, onClick: () => void scheduleFor(1) },
              { label: t('timeSpread.actions.remove'), icon: CalendarX, onClick: () => void unschedule() },
            ]}
          />
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
  );
};

export default TimeSpreadRow;
