import { TaskStatus } from '@nicoflow/shared/types';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useConfirmComplete } from '@/features/Tasks/useConfirmComplete';
import { useDebouncedValue } from '@/hooks';
import { useGetFocusQuery, useUpdateTaskStatusMutation } from '@/lib/store';
import { showErrorToast } from '@/lib/utils';

import FocusChips from './components/FocusChips';
import FocusNowCard from './components/FocusNowCard';
import FocusTaskRow from './components/FocusTaskRow';
import FocusEmptyState from './states/FocusEmptyState';
import FocusLoadingState from './states/FocusLoadingState';
import { FOCUS_LIMIT } from './data';
import { useFocusChips } from './useFocusChips';
import { useFocusSession } from './useFocusSession';
import { useFocusTimer } from './useFocusTimer';

// The signature screen: state how much time you have, get a ranked shortlist,
// then run a calm one-at-a-time execution loop — never leaving the page.
const FocusView = () => {
  const { t } = useTranslation('task');
  const { available, energy, setAvailable, setEnergy, clear, hasTimeBudget } = useFocusChips();
  const [updateTaskStatus, { isLoading: isCompleting }] = useUpdateTaskStatusMutation();
  const { guardComplete, confirmDialog } = useConfirmComplete();

  const debouncedAvailable = useDebouncedValue(available, 300);
  const debouncedEnergy = useDebouncedValue(energy, 300);

  const { data: tasks = [], isFetching } = useGetFocusQuery(
    { available: debouncedAvailable, energy: debouncedEnergy, limit: FOCUS_LIMIT },
    { skip: debouncedAvailable === undefined }
  );

  const isRanking = isFetching || (hasTimeBudget && debouncedAvailable !== available);

  const session = useFocusSession(tasks);
  const timer = useFocusTimer(session.current);

  const handleDone = () => {
    const done = session.current;
    if (!done) return;
    guardComplete(done, TaskStatus.DONE, async () => {
      try {
        await updateTaskStatus({ id: done.id, status: TaskStatus.DONE }).unwrap();
        toast.success(t('focus.completed'));
        session.advance();
      } catch (error) {
        showErrorToast(error, toast);
      }
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('focus.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('focus.subtitle')}</p>
        </div>

        <FocusChips available={available} onAvailableChange={setAvailable} energy={energy} onEnergyChange={setEnergy} />

        {!hasTimeBudget ? (
          // Default state: no list until the user picks how much time they have.
          <div
            data-testid="focus-time-prompt"
            className="flex flex-col items-center justify-center gap-3 py-12 sm:py-16 text-center"
          >
            <div className="rounded-full bg-muted ring-1 ring-border p-4">
              <Clock className="h-8 w-8 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-base font-medium text-foreground">{t('focus.pickTime.title')}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{t('focus.pickTime.description')}</p>
          </div>
        ) : session.current ? (
          // Session running: one NOW card + dimmed "next up".
          <div className="space-y-6" data-testid="focus-session">
            <FocusNowCard
              task={session.current}
              timer={timer}
              onDone={handleDone}
              onCancel={session.cancel}
              isBusy={isCompleting}
            />

            {session.upNext.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('focus.upNext')}
                </p>
                {session.upNext.map((task, index) => (
                  <FocusTaskRow key={task.id} task={task} index={index} onStart={session.start} dimmed />
                ))}
              </div>
            )}
          </div>
        ) : isRanking ? (
          <FocusLoadingState count={FOCUS_LIMIT} />
        ) : tasks.length > 0 ? (
          // Ranked shortlist, pre-session: pick one to Start.
          <div className="space-y-3 sm:space-y-4" data-testid="focus-list">
            {tasks.map((task, index) => (
              <FocusTaskRow key={task.id} task={task} index={index} onStart={session.start} />
            ))}
          </div>
        ) : (
          <FocusEmptyState onClearChips={clear} />
        )}
      </motion.div>
      {confirmDialog}
    </div>
  );
};

export default FocusView;
