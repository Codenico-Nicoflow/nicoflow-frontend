import { useEffect, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useCreateTaskMutation, useUpdateTaskMutation } from '@my-monorepo/store';
import type { ITask } from '@my-monorepo/types';
import type { TaskFormData } from '@my-monorepo/utils';
import { showErrorToast, showSuccessToast, taskSchema, ToastMessages } from '@my-monorepo/utils';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';

import TaskActionButtons from './fields/TaskActionButtons';
import TaskDescriptionField from './fields/TaskDescriptionField';
import TaskDueDateField from './fields/TaskDueDateField';
import TaskEstimatedMinutesField from './fields/TaskEstimatedMinutesField';
import TaskNameField from './fields/TaskNameField';
import TaskPriorityField from './fields/TaskPriorityField';
import TaskUrlField from './fields/TaskUrlField';
import TaskDialogHeader from './TaskDialogHeader';

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
  }, [task, form]);

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

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl sm:rounded-lg rounded-none"
      >
        <DialogHeader className="p-4 sm:p-6">
          <TaskDialogHeader isEditMode={isEditMode} />
          <DialogTitle className="sr-only">{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="p-4 sm:p-6"
        >
          <Form {...form} key={task?.id || 'new'}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TaskNameField control={form.control as any} />
              <TaskDescriptionField control={form.control as any} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TaskPriorityField control={form.control as any} />
                <TaskDueDateField control={form.control as any} />
              </div>

              <TaskEstimatedMinutesField control={form.control as any} />

              <TaskUrlField control={form.control as any} />

              <TaskActionButtons
                isLoading={isCreateLoading || isUpdateLoading}
                isEditMode={isEditMode}
                onCancel={handleCancel}
                isDisabled={isEditMode && !hasChanges}
              />
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
