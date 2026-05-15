import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const listItemCardVariants = cva(
  'transition-all duration-200 backdrop-blur-sm select-none rounded-lg border border-border bg-background/80',
  {
    variants: {
      variant: {
        default: 'py-1.5 px-2.5 sm:py-2 sm:px-3',
        compact: 'py-1 px-2 sm:py-1.5 sm:px-2.5',
        comfortable: 'py-2 px-3 sm:py-3 sm:px-4',
      },
      borderColor: {
        none: '',
        primary: 'border-l-4 border-l-primary/50 hover:border-l-primary',
        success: 'border-l-4 border-l-success/50 hover:border-l-success',
        muted: 'border-l-4 border-l-muted',
        default: 'border-l-4',
      },
      hoverable: {
        true: 'hover:shadow-sm',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      borderColor: 'none',
      hoverable: true,
    },
  }
);

export interface ListItemCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemCardVariants> {
  asChild?: boolean;
  'data-testid'?: string;
}

export const ListItemCard = React.forwardRef<HTMLDivElement, ListItemCardProps>(
  ({ className, variant, borderColor, hoverable, 'data-testid': testId, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-testid={testId || 'list-item-card'}
        className={cn(listItemCardVariants({ variant, borderColor, hoverable }), className)}
        {...props}
      />
    );
  }
);
ListItemCard.displayName = 'ListItemCard';
