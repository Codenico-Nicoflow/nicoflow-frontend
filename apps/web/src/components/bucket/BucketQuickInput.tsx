import { zodResolver } from '@hookform/resolvers/zod';
import { Inbox, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useCreateBucketMutation } from '@my-monorepo/store';
import { type BucketFormData, bucketSchema } from '@my-monorepo/utils';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface BucketQuickInputProps {
  onSuccess?: () => void;
  placeholder?: string;
  compact?: boolean;
}

const BucketQuickInput = ({
  onSuccess,
  placeholder = 'Capture anything on your mind...',
  compact = false,
}: BucketQuickInputProps) => {
  const [createBucket, { isLoading }] = useCreateBucketMutation();

  const form = useForm<BucketFormData>({
    resolver: zodResolver(bucketSchema),
    defaultValues: {
      content: '',
    },
  });

  const onSubmit = async (data: BucketFormData) => {
    try {
      await createBucket(data).unwrap();
      toast.success('Added to bucket');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add to bucket');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Cmd/Ctrl, allow new line with Cmd/Ctrl
    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={placeholder}
                  className={cn(
                    'resize-none min-h-[60px] sm:min-h-[80px]',
                    compact && 'min-h-[50px] text-sm',
                    'focus-visible:ring-2 focus-visible:ring-primary'
                  )}
                  onKeyDown={handleKeyDown}
                  rows={compact ? 2 : 3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isLoading || !form.watch('content')}
          className={cn('w-full sm:w-auto', compact && 'h-9 text-sm')}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Inbox className="mr-2 h-4 w-4" />
              Add to Bucket
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default BucketQuickInput;
