import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { DescriptionField, FormDialog } from '@/components';
import { Form } from '@/components/ui/form.tsx';
import { useUpdateBucketMutation } from '@/lib/store';
import { type IBucket } from '@/lib/types';
import { type BucketFormData, bucketSchema, showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';
import { hasFormChanges } from '@/lib/utils';

interface BucketEditDialogProps {
  bucket: IBucket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BucketEditDialog = ({ bucket, open, onOpenChange }: BucketEditDialogProps) => {
  const [updateBucket, { isLoading }] = useUpdateBucketMutation();

  const form = useForm<BucketFormData>({
    resolver: zodResolver(bucketSchema),
    defaultValues: {
      content: '',
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (bucket) {
      form.reset({
        content: bucket.content,
      });
    }
  }, [bucket, form]);

  const hasChanges = hasFormChanges(true, bucket, watchedValues, ['content']);

  const onSubmit = async (data: BucketFormData) => {
    if (!bucket) return;

    try {
      await updateBucket({ id: bucket.id, data }).unwrap();
      showSuccessToast(ToastMessages.BUCKET_UPDATED, toast);
      onOpenChange(false);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Bucket"
      description="Update the content of your bucket item."
      icon={Edit}
      isEditMode
      isLoading={isLoading}
      hasChanges={hasChanges}
      onSubmit={form.handleSubmit(onSubmit)}
      maxWidth="md"
    >
      <Form {...form}>
        <DescriptionField
          control={form.control}
          label="Content"
          placeholder="What's on your mind?"
          fieldName="content"
          minHeight="120px"
          delay={0.1}
        />
      </Form>
    </FormDialog>
  );
};
