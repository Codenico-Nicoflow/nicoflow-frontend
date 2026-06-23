import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components';
import { useDeleteBucketMutation } from '@/lib/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

interface BucketDeleteDialogProps {
  bucketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BucketDeleteDialog = ({ bucketId, open, onOpenChange }: BucketDeleteDialogProps) => {
  const { t } = useTranslation('bucket');
  const [deleteBucket, { isLoading }] = useDeleteBucketMutation();

  const handleDelete = async () => {
    if (!bucketId) return;

    try {
      await deleteBucket(bucketId).unwrap();
      showSuccessToast(ToastMessages.BUCKET_DELETED, toast);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      description={t('deleteDialog.description')}
      icon={Trash2}
      variant="danger"
      confirmLabel={t('deleteDialog.confirmLabel')}
      onConfirm={handleDelete}
      isLoading={isLoading}
      destructive
    />
  );
};
