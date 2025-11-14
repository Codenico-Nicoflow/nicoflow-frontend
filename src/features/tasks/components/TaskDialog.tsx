import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  DescriptionField,
  DueDateField,
  EstimatedTimeField,
  NameField,
  PriorityField,
  UrlField,
} from '@/components/fields';
import { DialogFieldGrid } from '@/components/ui/dialog-field-grid';
import { Form } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { useCreateTaskMutation, useUpdateTaskMutation } from '@/lib/store';
import type { ITask } from '@/lib/types';
import type { TaskFormData } from '@/lib/utils';
import { hasFormChanges, showErrorToast, showSuccessToast, taskSchema, ToastMessages } from '@/lib/utils';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ITask;
  projectId: number;
  onSuccess?: () => void;
}

const TaskDialog = ({ open, onOpenChange, task, projectId, onSuccess }: TaskDialogProps) => {
  const isEditMode = !!task;

  const [createTask, { isLoading: isCreateLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdateLoading }] = useUpdateTaskMutation();

  const form = useForm<TaskFormData>({
    defaultValues: {
      name: task?.name || '',
      description: task?.description || '',
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
        name: task.name,
        description: task.description || '',
        priority: task.priority || 'low',
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        estimatedMinutes: task.estimatedMinutes || undefined,
        url: task.url || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
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
          ...data,
          projectId,
          dueDate: data.dueDate ? data.dueDate.toISOString() : null,
          estimatedMinutes:
            data.estimatedMinutes === null || data.estimatedMinutes === undefined ? null : data.estimatedMinutes,
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
      title={isEditMode ? 'Edit Task' : 'Create New Task'}
      description={isEditMode ? 'Update task details' : 'Add a new task to your project'}
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
            label="Task Name"
            icon={CheckSquare}
            placeholder="Enter task name"
            delay={0.1}
          />
          <DescriptionField
            control={form.control}
            label="Description"
            placeholder="Add task details..."
            minHeight="100px"
            delay={0.15}
          />

          <DialogFieldGrid columns={2}>
            <PriorityField control={form.control} delay={0.2} />
            <DueDateField control={form.control} delay={0.25} />
          </DialogFieldGrid>

          <EstimatedTimeField control={form.control} delay={0.3} />
          <UrlField control={form.control} delay={0.35} />
        </div>
      </Form>
    </FormDialog>
  );
};

export default TaskDialog;
