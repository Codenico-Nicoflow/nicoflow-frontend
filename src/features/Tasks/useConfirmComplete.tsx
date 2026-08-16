import { useState } from 'react';

import { type ITask, type TaskStatus } from '@nicoflow/shared/types';
import { ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components';

import { needsCompletionConfirm } from './completionGuard';

type GuardedTask = Pick<ITask, 'openSubtaskCount'>;

interface PendingCompletion {
  openCount: number;
  run: () => void | Promise<void>;
}

/**
 * Guards a status change that completes a task: with open subtasks it asks
 * first, otherwise it runs straight through. Every surface that can check a
 * task off shares this so the question is asked identically everywhere.
 *
 * Callers wrap their existing transition and render the returned dialog:
 *   const { guardComplete, confirmDialog } = useConfirmComplete();
 *   guardComplete(task, next, () => updateStatus({ id, status: next }).unwrap());
 */
export const useConfirmComplete = () => {
  const { t } = useTranslation('task');
  const [pending, setPending] = useState<PendingCompletion | null>(null);

  const guardComplete = (task: GuardedTask, nextStatus: TaskStatus, run: () => void | Promise<void>) => {
    if (!needsCompletionConfirm(task, nextStatus)) {
      void run();
      return;
    }
    setPending({ openCount: task.openSubtaskCount, run });
  };

  const confirmDialog = pending ? (
    <ConfirmDialog
      open
      onOpenChange={open => !open && setPending(null)}
      title={t('completeConfirm.title')}
      description={t('completeConfirm.description', { count: pending.openCount })}
      confirmLabel={t('completeConfirm.confirm')}
      icon={ListChecks}
      variant="warning"
      data-testid="task-complete-confirm"
      onConfirm={async () => {
        await pending.run();
        setPending(null);
      }}
    />
  ) : null;

  return { guardComplete, confirmDialog };
};
