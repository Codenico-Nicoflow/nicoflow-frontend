import { format } from 'date-fns';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { AnimatedListItem, ListItemCard } from '@/components';
import { Button } from '@/components/ui/button';
import TaskBadges from '@/features/Tasks/components/TaskBadges';
import { useUpdateTaskMutation } from '@/lib/store';
import { type ITask, TaskStatus } from '@/lib/types';
import { showErrorToast } from '@/lib/utils';

interface FocusTaskRowProps {
  task: ITask;
  index: number;
}

// One ranked focus result. Start commits the choice: the task becomes active
// and is softly scheduled for today; the Task tag invalidation re-ranks the list.
const FocusTaskRow = ({ task, index }: FocusTaskRowProps) => {
  const { t } = useTranslation('task');
  const [updateTask, { isLoading }] = useUpdateTaskMutation();

  const handleStart = async () => {
    try {
      await updateTask({
        id: task.id,
        status: TaskStatus.ACTIVE,
        scheduledFor: format(new Date(), 'yyyy-MM-dd'),
      }).unwrap();
      toast.success(t('focus.started'));
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <AnimatedListItem index={index}>
      <ListItemCard variant="default" borderColor="primary">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-sm font-semibold text-muted-foreground w-5 text-center flex-shrink-0">{index + 1}</span>

          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
            <h3 className="font-medium text-sm sm:text-base text-foreground leading-snug sm:leading-tight">
              {task.title}
            </h3>
            <TaskBadges task={task} />
            {/* Phase-4 Pro slot: the AI "why this?" rationale renders here — no AI call today. */}
            <div hidden data-testid={`focus-rationale-${task.id}`} />
          </div>

          <Button
            onClick={() => void handleStart()}
            disabled={isLoading}
            data-testid={`focus-start-${task.id}`}
            className="flex-shrink-0"
          >
            <Play className="h-4 w-4 me-1.5" aria-hidden />
            {t('focus.start')}
          </Button>
        </div>
      </ListItemCard>
    </AnimatedListItem>
  );
};

export default FocusTaskRow;
