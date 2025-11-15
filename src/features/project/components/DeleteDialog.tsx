import { Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components';
import { categoryApi, useDeleteProjectMutation } from '@/lib/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  projectName?: string;
  projectId: number;
}

const DeleteDialog = ({ open, onOpenChange, onSuccess, projectName, projectId }: DeleteDialogProps) => {
  const [deleteProject, { isLoading }] = useDeleteProjectMutation();
  const dispatch = useDispatch();

  const handleDelete = async () => {
    try {
      await deleteProject(projectId).unwrap();
      showSuccessToast(ToastMessages.PROJECT_DELETED, toast);
      dispatch(categoryApi.util.invalidateTags(['Category']));
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      showErrorToast(error, toast);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Project"
      description={
        <>
          Are you sure you want to delete{' '}
          <span className="font-semibold text-foreground">{projectName || 'this project'}</span>? This action cannot be
          undone.
        </>
      }
      icon={Trash2}
      variant="danger"
      confirmLabel="Delete Project"
      onConfirm={handleDelete}
      isLoading={isLoading}
      destructive
    />
  );
};

export default DeleteDialog;
