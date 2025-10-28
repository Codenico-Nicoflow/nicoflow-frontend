import { useEffect, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useCreateTaskMutation, useUpdateTaskMutation } from '@my-monorepo/store';
import type { ITask } from '@my-monorepo/types';
import type { TaskFormData } from '@my-monorepo/utils';
import { showErrorToast, showSuccessToast, taskSchema, ToastMessages } from '@my-monorepo/utils';

import { DialogFieldGrid } from '@/components/ui/dialog-field-grid';
import { Form } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';

import TaskDescriptionField from './fields/TaskDescriptionField';
import TaskDueDateField from './fields/TaskDueDateField';
import TaskEstimatedMinutesField from './fields/TaskEstimatedMinutesField';
import TaskNameField from './fields/TaskNameField';
import TaskPriorityField from './fields/TaskPriorityField';
import TaskUrlField from './fields/TaskUrlField';

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

  const hasChanges = useMemo(() => {
    if (!isEditMode || !task) return true;

    const originalData = {
      name: task.name,
      description: task.description || '',
      priority: task.priority || 'low',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
      estimatedMinutes: task.estimatedMinutes ?? undefined,
      url: task.url || '',
    };

    const currentData = {
      name: watchedValues.name || '',
      description: watchedValues.description || '',
      priority: watchedValues.priority || 'low',
      dueDate: watchedValues.dueDate ? new Date(watchedValues.dueDate).toISOString() : undefined,
      estimatedMinutes: watchedValues.estimatedMinutes === null ? undefined : watchedValues.estimatedMinutes,
      url: watchedValues.url || '',
    };

    return Object.keys(originalData).some(
      key => originalData[key as keyof typeof originalData] !== currentData[key as keyof typeof currentData]
    );
  }, [isEditMode, task, watchedValues]);

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
          <TaskNameField control={form.control} />
          <TaskDescriptionField control={form.control} />

          <DialogFieldGrid columns={2}>
            <TaskPriorityField control={form.control} />
            <TaskDueDateField control={form.control} />
          </DialogFieldGrid>

          <TaskEstimatedMinutesField control={form.control} />
          <TaskUrlField control={form.control} />
        </div>
      </Form>
    </FormDialog>
  );
};

export default TaskDialog;
