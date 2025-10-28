import * as React from 'react';

import { cn } from '@/lib/utils';

export interface DialogFieldGridProps {
  children: React.ReactNode;
  columns?: 1 | 2;
  className?: string;
}

const DialogFieldGrid = ({ children, columns = 1, className }: DialogFieldGridProps) => {
  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4',
        columns === 2 && 'sm:grid-cols-2',
        columns === 1 && 'grid-cols-1',
        className
      )}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Check if child has fullWidth prop
          const fullWidth = (child.props as any).fullWidth;
          if (fullWidth && columns === 2) {
            return <div className="sm:col-span-2">{child}</div>;
          }
        }
        return child;
      })}
    </div>
  );
};

export { DialogFieldGrid };
