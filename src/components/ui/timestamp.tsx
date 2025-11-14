import * as React from 'react';

import { formatDistanceToNow } from 'date-fns';

import { cn } from '@/lib/utils';

export interface TimestampProps {
  date: string | Date;
  className?: string;
  addSuffix?: boolean;
}

const Timestamp = ({ date, className, addSuffix = true }: TimestampProps) => {
  const formattedDate = React.useMemo(() => {
    return formatDistanceToNow(new Date(date), { addSuffix });
  }, [date, addSuffix]);

  return <span className={cn('text-xs text-muted-foreground', className)}>{formattedDate}</span>;
};

export { Timestamp };
