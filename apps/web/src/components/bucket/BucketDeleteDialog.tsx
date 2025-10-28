import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useDeleteBucketMutation } from '@my-monorepo/store';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface BucketDeleteDialogProps {
  bucketId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BucketDeleteDialog = ({ bucketId, open, onOpenChange }: BucketDeleteDialogProps) => {
  const [deleteBucket, { isLoading }] = useDeleteBucketMutation();

  const handleDelete = async () => {
    if (!bucketId) return;

    try {
      await deleteBucket(bucketId).unwrap();
      toast.success('Bucket item deleted');
    } catch (error: any) {
      const errorMessage =
        error && typeof error === 'object' && 'data' in error && typeof error.data === 'object' && error.data?.message
          ? error.data.message
          : 'Failed to delete bucket item';
      toast.error(errorMessage);
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

export default BucketDeleteDialog;
