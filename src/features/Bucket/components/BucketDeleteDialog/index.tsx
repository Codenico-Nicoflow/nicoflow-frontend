import { Trash2 } from 'lucide-react';
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
      title="Delete Bucket Item"
      description="Are you sure you want to delete this bucket item? This action cannot be undone."
      icon={Trash2}
      variant="danger"
      confirmLabel="Delete"
      onConfirm={handleDelete}
      isLoading={isLoading}
      destructive
    />
  );
};
