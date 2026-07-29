import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import TaskBadges from '@/features/Tasks/components/TaskBadges';
import type { ITask } from '@/lib/types';

import type { FocusTimer as FocusTimerState } from '../useFocusTimer';

import FocusTimer from './FocusTimer';

interface FocusNowCardProps {
  task: ITask;
  timer: FocusTimerState;
  onDone: () => void;
  onCancel: () => void;
  isBusy: boolean;
}

// The NOW card — the single task the user is doing right now, given room to
// breathe above the dimmed "next up" list. Done finishes it; Not now exits back
// to the shortlist (to switch, the user Starts another task from up next).
const FocusNowCard = ({ task, timer, onDone, onCancel, isBusy }: FocusNowCardProps) => {
  const { t } = useTranslation('task');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      data-testid="focus-now-card"
      className="rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-primary/10 to-primary/5 p-5 sm:p-6 shadow-sm"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-primary">{t('focus.now')}</span>

      <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-foreground leading-snug">{task.title}</h2>

      {task.notes && <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{task.notes}</p>}

      <div className="mt-3">
        <TaskBadges task={task} />
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-3 sm:p-4">
        <FocusTimer
          seconds={timer.seconds}
          estimatedMinutes={task.estimatedMinutes ?? null}
          status={timer.status}
          isBusy={timer.isBusy}
          onPause={timer.pause}
          onResume={timer.resume}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
        <Button onClick={onDone} disabled={isBusy} data-testid="focus-done" size="lg" className="flex-1 sm:flex-none">
          <Check className="h-4 w-4 me-1.5" aria-hidden />
          {t('focus.done')}
        </Button>
        <Button
          onClick={onCancel}
          disabled={isBusy}
          variant="outline"
          size="lg"
          data-testid="focus-cancel"
          className="flex-1 sm:flex-none"
        >
          <X className="h-4 w-4 me-1.5" aria-hidden />
          {t('focus.notNow')}
        </Button>
      </div>
    </motion.div>
  );
};

export default FocusNowCard;
