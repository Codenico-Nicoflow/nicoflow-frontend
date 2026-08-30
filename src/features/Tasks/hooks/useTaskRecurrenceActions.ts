import React, { useState } from 'react';

import type { ITask } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components';
import { useDeleteRecurrenceRuleMutation, useDeleteTaskMutation, useSkipTaskOccurrenceMutation } from '@/lib/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

export interface UseTaskRecurrenceActionsResult {
  isRecurringInstance: boolean;
  skip: () => void;
  endSeries: () => void;
  deleteTask: () => void;
  dialogs: React.ReactNode;
}

export function useTaskRecurrenceActions(task: ITask): UseTaskRecurrenceActionsResult {
  const { t } = useTranslation('recurrence');
  const isRecurringInstance = !!task.recurrenceRuleId;

  const [skipOccurrence, { isLoading: isSkipping }] = useSkipTaskOccurrenceMutation();
  const [deleteRule, { isLoading: isDeletingRule }] = useDeleteRecurrenceRuleMutation();
  const [deleteTaskMutation, { isLoading: isDeletingTask }] = useDeleteTaskMutation();

  const [skipOpen, setSkipOpen] = useState(false);
  const [endSeriesOpen, setEndSeriesOpen] = useState(false);

  const handleSkipConfirm = async () => {
    try {
      await skipOccurrence(task.id).unwrap();
      toast.success(t('toast.skipped'));
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const handleEndSeriesConfirm = async () => {
    if (!task.recurrenceRuleId) return;
    try {
      await deleteRule(task.recurrenceRuleId).unwrap();
      toast.success(t('toast.seriesEnded'));
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const handleDeleteNonRecurring = async () => {
    try {
      await deleteTaskMutation(task.id).unwrap();
      showSuccessToast(ToastMessages.TASK_DELETED_SUCCESSFULLY, toast);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const skip = () => setSkipOpen(true);
  const endSeries = () => setEndSeriesOpen(true);
  // For a live recurring instance the "delete" action surfaces as "end series"
  // so the guarded 409 is never the primary UX path.
  const deleteTask = isRecurringInstance ? () => setEndSeriesOpen(true) : () => void handleDeleteNonRecurring();

  const dialogs = React.createElement(
    React.Fragment,
    null,
    React.createElement(ConfirmDialog, {
      open: skipOpen,
      onOpenChange: setSkipOpen,
      title: t('skip.title'),
      description: t('skip.description'),
      confirmLabel: t('skip.confirmLabel'),
      cancelLabel: t('skip.cancelLabel'),
      variant: 'info',
      isLoading: isSkipping,
      onConfirm: handleSkipConfirm,
      'data-testid': 'skip-occurrence-dialog',
    }),
    React.createElement(ConfirmDialog, {
      open: endSeriesOpen,
      onOpenChange: setEndSeriesOpen,
      title: t('endSeries.title'),
      description: t('endSeries.description'),
      confirmLabel: t('endSeries.confirmLabel'),
      cancelLabel: t('endSeries.cancelLabel'),
      variant: 'danger',
      destructive: true,
      isLoading: isDeletingRule || isDeletingTask,
      onConfirm: handleEndSeriesConfirm,
      'data-testid': 'end-series-dialog',
    })
  );

  return { isRecurringInstance, skip, endSeries, deleteTask, dialogs };
}
