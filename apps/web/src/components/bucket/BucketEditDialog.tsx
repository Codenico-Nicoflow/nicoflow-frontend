import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useUpdateBucketMutation } from '@my-monorepo/store';
import { type IBucket } from '@my-monorepo/types';
import { type BucketFormData, bucketSchema } from '@my-monorepo/utils';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Textarea } from '@/components/ui/textarea';

interface BucketEditDialogProps {
  bucket: IBucket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BucketEditDialog = ({ bucket, open, onOpenChange }: BucketEditDialogProps) => {
  const [updateBucket, { isLoading }] = useUpdateBucketMutation();

  const form = useForm<BucketFormData>({
    resolver: zodResolver(bucketSchema),
    defaultValues: {
      content: '',
    },
  });

  useEffect(() => {
    if (bucket) {
      form.reset({
        content: bucket.content,
      });
    }
  }, [bucket, form]);

  const onSubmit = async (data: BucketFormData) => {
    if (!bucket) return;

    try {
      await updateBucket({ id: bucket.id, data }).unwrap();
      toast.success('Bucket updated');
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof (error as { data?: { message?: string } }).data === 'object' &&
        (error as { data?: { message?: string } }).data?.message
          ? (error as { data: { message: string } }).data.message
          : 'Failed to update bucket';
      toast.error(errorMessage);
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
      onSubmit={form.handleSubmit(onSubmit)}
      maxWidth="md"
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="What's on your mind?" className="resize-none min-h-[120px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </FormDialog>
  );
};

export default BucketEditDialog;
