import { zodResolver } from '@hookform/resolvers/zod';
import { Inbox, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button.tsx';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useCreateBucketMutation } from '@/lib/store';
import { type BucketFormData, bucketSchema, showErrorToast } from '@/lib/utils';
import { cn } from '@/lib/utils';

const BUCKET_CONTENT_MAX_LENGTH = 500;

interface BucketQuickInputProps {
  onSuccess?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export const BucketQuickInput = ({ onSuccess, placeholder, compact = false }: BucketQuickInputProps) => {
  const { t } = useTranslation('bucket');
  const resolvedPlaceholder = placeholder ?? t('quickInput.defaultPlaceholder');
  const [createBucket, { isLoading }] = useCreateBucketMutation();

  const form = useForm<BucketFormData>({
    resolver: zodResolver(bucketSchema),
    defaultValues: {
      content: '',
    },
  });
  const contentLength = form.watch('content')?.length ?? 0;

  const onSubmit = async (data: BucketFormData) => {
    try {
      await createBucket(data).unwrap();
      toast.success(t('addPlaceholder'));
      form.reset();
      onSuccess?.();
    } catch (error) {
      showErrorToast(error, toast);
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
                  placeholder={resolvedPlaceholder}
                  className={cn(
                    'resize-none min-h-[60px] sm:min-h-[80px]',
                    compact && 'min-h-[50px] text-sm',
                    'focus-visible:ring-2 focus-visible:ring-primary'
                  )}
                  onKeyDown={handleKeyDown}
                  rows={compact ? 2 : 3}
                  maxLength={BUCKET_CONTENT_MAX_LENGTH}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {contentLength}/{BUCKET_CONTENT_MAX_LENGTH}
          </span>
          <Button type="submit" disabled={isLoading || !form.watch('content')} className={cn(compact && 'h-9 text-sm')}>
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('quickInput.submitting')}
              </>
            ) : (
              <>
                <Inbox className="me-2 h-4 w-4" />
                {t('quickInput.submit')}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
