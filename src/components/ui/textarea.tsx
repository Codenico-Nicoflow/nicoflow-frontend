import * as React from 'react';

import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps & { 'data-testid'?: string }>(
  ({ className, 'data-testid': testId, ...props }, ref) => {
    return (
      <textarea
        data-testid={testId || 'textarea'}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'aria-invalid:border-destructive',
          'transition-colors duration-200 hover:bg-primary/10',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
