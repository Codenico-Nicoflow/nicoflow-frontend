import * as React from 'react';

import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  'data-testid': testId,
}: EmptyStateProps) => {
  return (
    <div
      data-testid={testId || 'empty-state'}
      className={cn('flex flex-col items-center justify-center py-12 sm:py-16 text-center', className)}
    >
      <div
        data-testid={testId ? `${testId}-icon` : 'empty-state-icon'}
        className="rounded-full bg-muted p-4 sm:p-6 mb-4"
      >
        <Icon className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
      </div>
      <h3
        data-testid={testId ? `${testId}-title` : 'empty-state-title'}
        className="text-base sm:text-lg font-medium text-foreground mb-2"
      >
        {title}
      </h3>
      {description && (
        <p
          data-testid={testId ? `${testId}-description` : 'empty-state-description'}
          className="text-sm text-muted-foreground max-w-sm mb-4"
        >
          {description}
        </p>
      )}
      {action && (
        <div data-testid={testId ? `${testId}-action` : 'empty-state-action'} className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};
