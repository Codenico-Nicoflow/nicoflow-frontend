import { Trash2 } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components';
import { areaApi, invalidateApiTags, projectApi, useDeleteProjectMutation } from '@/lib/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  projectName?: string;
  projectId: string;
}

export const ProjectDeleteDialog = ({ open, onOpenChange, onSuccess, projectName, projectId }: DeleteDialogProps) => {
  const { t } = useTranslation('project');
  const [deleteProject, { isLoading }] = useDeleteProjectMutation();
  const dispatch = useDispatch();

  const handleDelete = async () => {
    try {
      await deleteProject(projectId).unwrap();
      showSuccessToast(ToastMessages.PROJECT_DELETED, toast);
      invalidateApiTags(dispatch, projectApi, ['Project']);
      invalidateApiTags(dispatch, areaApi, ['Area']);
      onSuccess?.();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('delete.title')}
      description={
        <Trans
          t={t}
          i18nKey="delete.confirmDescription"
          values={{ name: projectName || t('delete.title') }}
          components={{ name: <span className="font-semibold text-foreground" /> }}
        />
      }
      icon={Trash2}
      variant="danger"
      confirmLabel={t('delete.confirmLabel')}
      onConfirm={handleDelete}
      isLoading={isLoading}
      destructive
    />
  );
};

export default ProjectDeleteDialog;
