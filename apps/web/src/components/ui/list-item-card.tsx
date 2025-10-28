import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const listItemCardVariants = cva('transition-all duration-200 backdrop-blur-sm select-none rounded-lg border', {
  variants: {
    variant: {
      default: 'py-1.5 px-2.5 sm:py-2 sm:px-3',
      compact: 'py-1 px-2 sm:py-1.5 sm:px-2.5',
      comfortable: 'py-2 px-3 sm:py-3 sm:px-4',
    },
    borderColor: {
      none: '',
      primary: 'border-l-4 border-l-primary/50 hover:border-l-primary',
      success: 'border-l-4 border-l-green-500/50 hover:border-l-green-500',
      muted: 'border-l-4 border-l-muted',
      default: 'border-l-4',
    },
    hoverable: {
      true: 'hover:shadow-md',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    borderColor: 'none',
    hoverable: true,
  },
});

export interface ListItemCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemCardVariants> {
  asChild?: boolean;
}

const ListItemCard = React.forwardRef<HTMLDivElement, ListItemCardProps>(
  ({ className, variant, borderColor, hoverable, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          listItemCardVariants({ variant, borderColor, hoverable }),
          'bg-background/80 dark:bg-background/80',
          className
        )}
        {...props}
      />
    );
  }
);
ListItemCard.displayName = 'ListItemCard';

export { ListItemCard, listItemCardVariants };
