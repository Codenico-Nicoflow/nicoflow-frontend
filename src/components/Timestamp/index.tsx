import * as React from 'react';

import { formatDistanceToNow } from 'date-fns';
import type { Locale } from 'date-fns/locale';

import { cn } from '@/lib/utils';

export interface TimestampProps {
  date: string | Date;
  className?: string;
  addSuffix?: boolean;
  // Optional date-fns locale so relative times localize (e.g. "לפני שעתיים").
  // Omitted → date-fns default (English).
  locale?: Locale;
  'data-testid'?: string;
}

export const Timestamp = ({ date, className, addSuffix = true, locale, 'data-testid': testId }: TimestampProps) => {
  const formattedDate = React.useMemo(() => {
    return formatDistanceToNow(new Date(date), { addSuffix, locale });
  }, [date, addSuffix, locale]);

  return (
    <span data-testid={testId || 'timestamp'} className={cn('text-xs text-muted-foreground', className)}>
      {formattedDate}
    </span>
  );
};
