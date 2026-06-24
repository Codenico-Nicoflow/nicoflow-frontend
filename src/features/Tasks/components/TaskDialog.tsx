import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  DescriptionField,
  DialogFieldGrid,
  DueDateField,
  EstimatedTimeField,
  FormDialog,
  NameField,
  PriorityField,
  StatusField,
  UrlField,
} from '@/components';
import { Form } from '@/components/ui/form';
import { useCreateTaskMutation, useUpdateTaskMutation } from '@/lib/store';
import type { ITask } from '@/lib/types';
import type { TaskFormData } from '@/lib/utils';
import { hasFormChanges, showErrorToast, showSuccessToast, taskSchema, ToastMessages } from '@/lib/utils';

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

  const form = useForm<TaskFormData>({
    defaultValues: {
      title: task?.title || '',
      notes: task?.notes || '',
      status: task?.status || 'inbox',
      priority: task?.priority || 'low',
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      estimatedMinutes: task?.estimatedMinutes || undefined,
      url: task?.url || '',
    },
    resolver: zodResolver(taskSchema),
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        notes: task.notes || '',
        status: task.status || 'inbox',
        priority: task.priority || 'low',
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        estimatedMinutes: task.estimatedMinutes || undefined,
        url: task.url || '',
      });
    } else {
      form.reset({
        title: '',
        notes: '',
        status: 'inbox',
        priority: 'low',
        dueDate: undefined,
        estimatedMinutes: undefined,
        url: '',
      });
    }
  }, [task, form, open]);

  const normalizedWatchedValues = {
    ...watchedValues,
    dueDate: watchedValues.dueDate ? watchedValues.dueDate.toISOString() : null,
  };

  const hasChanges = hasFormChanges(isEditMode, task, normalizedWatchedValues);

  const onSubmit = async (data: TaskFormData) => {
    if (isEditMode && !hasChanges) {
      onOpenChange(false);
      return;
    }

    try {
      if (isEditMode) {
        await updateTask({
          id: task.id,
          ...data,
          dueDate: data.dueDate ? data.dueDate.toISOString() : null,
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
          notes: data.notes ?? undefined,
          dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
          estimatedMinutes: data.estimatedMinutes ?? undefined,
          scheduledFor: data.scheduledFor ?? undefined,
          url: data.url || '',
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_CREATED_SUCCESSFULLY, toast);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
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
            <DueDateField control={form.control} optional delay={0.25} />
          </DialogFieldGrid>

          <EstimatedTimeField control={form.control} optional delay={0.3} />
          <UrlField control={form.control} delay={0.35} optional />
        </div>
      </Form>
    </FormDialog>
  );
};

export default TaskDialog;
