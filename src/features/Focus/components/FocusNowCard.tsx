import { motion } from 'framer-motion';
import { Check, SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import TaskBadges from '@/features/Tasks/components/TaskBadges';
import type { ITask } from '@/lib/types';

interface FocusNowCardProps {
  task: ITask;
  onDone: () => void;
  onSkip: () => void;
  isBusy: boolean;
}

// The NOW card — the single task the user is doing right now, given room to
// breathe above the dimmed "next up" list. Done finishes it; Not now passes.
const FocusNowCard = ({ task, onDone, onSkip, isBusy }: FocusNowCardProps) => {
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

      <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
        <Button onClick={onDone} disabled={isBusy} data-testid="focus-done" size="lg" className="flex-1 sm:flex-none">
          <Check className="h-4 w-4 me-1.5" aria-hidden />
          {t('focus.done')}
        </Button>
        <Button
          onClick={onSkip}
          disabled={isBusy}
          variant="outline"
          size="lg"
          data-testid="focus-skip"
          className="flex-1 sm:flex-none"
        >
          <SkipForward className="h-4 w-4 me-1.5" aria-hidden />
          {t('focus.notNow')}
        </Button>
      </div>
    </motion.div>
  );
};

export default FocusNowCard;
