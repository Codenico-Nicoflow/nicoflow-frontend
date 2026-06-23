import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components';
import { useDeleteTaskMutation } from '@/lib/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

interface TaskDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  taskId: string;
  onSuccess?: () => void;
}

const TaskDeleteDialog = ({ open, onOpenChange, taskName, taskId, onSuccess }: TaskDeleteDialogProps) => {
  const { t } = useTranslation('task');
  const [deleteTask, { isLoading }] = useDeleteTaskMutation();

  const handleDelete = async () => {
    try {
      await deleteTask(taskId).unwrap();
      showSuccessToast(ToastMessages.TASK_DELETED_SUCCESSFULLY, toast);
      onSuccess?.();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      description={t('deleteDialog.description', { name: taskName })}
      icon={Trash2}
      variant="danger"
      confirmLabel={t('deleteDialog.confirmLabel')}
      onConfirm={handleDelete}
      isLoading={isLoading}
      destructive
    />
  );
};

export default TaskDeleteDialog;
