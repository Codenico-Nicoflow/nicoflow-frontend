import * as React from 'react';

import { formatDistanceToNow } from 'date-fns';

import { cn } from '@/lib/utils';

export interface TimestampProps {
  date: string | Date;
  className?: string;
  addSuffix?: boolean;
  'data-testid'?: string;
}

export const Timestamp = ({ date, className, addSuffix = true, 'data-testid': testId }: TimestampProps) => {
  const formattedDate = React.useMemo(() => {
    return formatDistanceToNow(new Date(date), { addSuffix });
  }, [date, addSuffix]);

  return (
    <span data-testid={testId || 'timestamp'} className={cn('text-xs text-muted-foreground', className)}>
      {formattedDate}
    </span>
  );
};
