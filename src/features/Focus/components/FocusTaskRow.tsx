import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AnimatedListItem, ListItemCard } from '@/components';
import { Button } from '@/components/ui/button';
import TaskBadges from '@/features/Tasks/components/TaskBadges';
import type { ITask } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FocusTaskRowProps {
  task: ITask;
  index: number;
  /** Begin this task — becomes the NOW card. */
  onStart: (taskId: string) => void;
  /** Dimmed "next up" treatment shown while a session is active. */
  dimmed?: boolean;
}

// A ranked focus candidate. Before a session it shows a prominent Start; while a
// session runs it becomes a dimmed "next up" row you can tap to switch to.
const FocusTaskRow = ({ task, index, onStart, dimmed = false }: FocusTaskRowProps) => {
  const { t } = useTranslation('task');

  return (
    <AnimatedListItem index={index}>
      <ListItemCard variant="default" borderColor="primary">
        <div className={cn('flex items-center gap-2 sm:gap-3', dimmed && 'opacity-70')}>
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
            onClick={() => onStart(task.id)}
            variant={dimmed ? 'ghost' : 'default'}
            data-testid={`focus-start-${task.id}`}
            className="flex-shrink-0"
          >
            <Play className="h-4 w-4 me-1.5" aria-hidden />
            {dimmed ? t('focus.switch') : t('focus.start')}
          </Button>
        </div>
      </ListItemCard>
    </AnimatedListItem>
  );
};

export default FocusTaskRow;
