import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckSquare, Repeat } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  CheckboxField,
  DescriptionField,
  DialogFieldGrid,
  EnergyField,
  EstimatedTimeField,
  FormDialog,
  NameField,
  PlanLimitAlert,
  PriorityField,
  ScheduledForField,
  StatusField,
  UrlField,
} from '@/components';
import { Form } from '@/components/ui/form';
import { useCreateTaskMutation, useUpdateTaskMutation } from '@/lib/store';
import type { ITask } from '@/lib/types';
import type { TaskFormData } from '@/lib/utils';
import {
  getApiErrorCode,
  hasFormChanges,
  showErrorToast,
  showSuccessToast,
  taskSchema,
  ToastMessages,
} from '@/lib/utils';

import { SubtaskAccordion } from './SubtaskAccordion';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ITask;
  projectId: string;
  onSuccess?: () => void;
}

const TaskDialog = ({ open, onOpenChange, task, projectId, onSuccess }: TaskDialogProps) => {
  const { t } = useTranslation('task');
  const isEditMode = !!task;

  const [createTask, { isLoading: isCreateLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdateLoading }] = useUpdateTaskMutation();

  const [planLimitHit, setPlanLimitHit] = useState(false);

  const form = useForm<TaskFormData>({
    defaultValues: {
      title: task?.title || '',
      notes: task?.notes || '',
      status: task?.status || 'inbox',
      priority: task?.priority || 'low',
      energy: task?.energy || 'medium',
      rollsOver: task?.rollsOver ?? true,
      scheduledFor: task?.scheduledFor ?? undefined,
      estimatedMinutes: task?.estimatedMinutes || undefined,
      url: task?.url || '',
    },
    resolver: zodResolver(taskSchema),
  });

  const watchedValues = form.watch();

  useEffect(() => {
    setPlanLimitHit(false);
    if (task) {
      form.reset({
        title: task.title,
        notes: task.notes || '',
        status: task.status || 'inbox',
        priority: task.priority || 'low',
        energy: task.energy || 'medium',
        rollsOver: task.rollsOver ?? true,
        scheduledFor: task.scheduledFor ?? undefined,
        estimatedMinutes: task.estimatedMinutes || undefined,
        url: task.url || '',
      });
    } else {
      form.reset({
        title: '',
        notes: '',
        status: 'inbox',
        priority: 'low',
        energy: 'medium',
        rollsOver: true,
        scheduledFor: undefined,
        estimatedMinutes: undefined,
        url: '',
      });
    }
  }, [task, form, open]);

  const hasChanges = hasFormChanges(isEditMode, task, watchedValues);

  const onSubmit = async (data: TaskFormData) => {
    if (isEditMode && !hasChanges) {
      onOpenChange(false);
      return;
    }

    setPlanLimitHit(false);

    try {
      if (isEditMode) {
        await updateTask({
          id: task.id,
          ...data,
          energy: data.energy,
          rollsOver: data.rollsOver,
          estimatedMinutes:
            data.estimatedMinutes === null || data.estimatedMinutes === undefined
              ? null
              : (data.estimatedMinutes ?? null),
          url: data.url || '',
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
      } else {
        await createTask({
          projectId,
          title: data.title,
          priority: data.priority,
          energy: data.energy,
          rollsOver: data.rollsOver,
          notes: data.notes ?? undefined,
          estimatedMinutes: data.estimatedMinutes ?? undefined,
          scheduledFor: data.scheduledFor ?? undefined,
          url: data.url || '',
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_CREATED_SUCCESSFULLY, toast);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // A plan-limit 403 becomes an inline upgrade CTA, not a generic error toast.
      if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
        setPlanLimitHit(true);
        return;
      }
      showErrorToast(error, toast);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? t('dialog.editTitle') : t('dialog.createTitle')}
      description={isEditMode ? t('dialog.editDescription') : t('dialog.createDescription')}
      icon={CheckSquare}
      isEditMode={isEditMode}
      isLoading={isCreateLoading || isUpdateLoading}
      hasChanges={hasChanges}
      onSubmit={form.handleSubmit(onSubmit)}
      maxWidth="xl"
    >
      <Form {...form}>
        <div className="space-y-4">
          {planLimitHit && <PlanLimitAlert />}

          <NameField
            control={form.control}
            fieldName="title"
            label={t('dialog.taskNameLabel')}
            icon={CheckSquare}
            placeholder={t('dialog.taskNamePlaceholder')}
            delay={0.1}
          />
          <DescriptionField
            control={form.control}
            fieldName="notes"
            label={t('dialog.descriptionLabel')}
            placeholder={t('dialog.descriptionPlaceholder')}
            minHeight="100px"
            optional
            delay={0.15}
          />

          {/* Status is only settable on existing tasks — new tasks default to inbox server-side. */}
          {isEditMode && <StatusField control={form.control} optional delay={0.18} />}

          <DialogFieldGrid columns={2}>
            <PriorityField control={form.control} delay={0.2} />
            <EnergyField control={form.control} delay={0.22} />
          </DialogFieldGrid>

          {/* Scheduling: a single soft intention (scheduledFor); rollsOver (default
              on) carries a passed task to Today — off, it quietly drops off. Never overdue. */}
          <div className="space-y-3 rounded-lg border border-border/60 p-3" data-testid="scheduling-block">
            <p className="text-sm font-semibold text-foreground">{t('dialog.schedulingTitle')}</p>
            <ScheduledForField control={form.control} delay={0.27} />
            <CheckboxField
              control={form.control}
              fieldName="rollsOver"
              icon={Repeat}
              label={t('dialog.rollsOverLabel')}
              description={t('dialog.rollsOverDescription')}
              delay={0.29}
            />
          </div>

          <EstimatedTimeField control={form.control} optional delay={0.3} />
          <UrlField control={form.control} delay={0.35} optional />

          {/* Subtasks only exist once the task does. */}
          {isEditMode && task && <SubtaskAccordion taskId={task.id} />}
        </div>
      </Form>
    </FormDialog>
  );
};

export default TaskDialog;
