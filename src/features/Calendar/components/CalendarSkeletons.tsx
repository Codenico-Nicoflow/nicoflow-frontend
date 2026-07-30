import { Skeleton } from '@/components/ui/skeleton';

import { HOUR_HEIGHT_PX, HOURS } from '../data';

/**
 * Per-view skeletons. A generic spinner would relayout the moment data lands;
 * each of these matches the geometry of the view it stands in for, so the
 * transition is a fill rather than a jump.
 */

export const GridSkeleton = ({ columns }: { columns: number }) => (
  <div className="flex" data-testid="calendar-skeleton-grid">
    <div className="w-14 shrink-0">
      {HOURS.map(hour => (
        <div key={hour} style={{ height: `${HOUR_HEIGHT_PX}px` }} className="pe-2 text-end">
          <Skeleton className="ms-auto h-3 w-8" />
        </div>
      ))}
    </div>
    {Array.from({ length: columns }, (_, column) => (
      <div key={column} className="flex-1 space-y-2 border-s border-border/40 p-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    ))}
  </div>
);

export const AgendaSkeleton = () => (
  <div className="space-y-6" data-testid="calendar-skeleton-agenda">
    {Array.from({ length: 3 }, (_, group) => (
      <div key={group} className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
);

export const MonthSkeleton = () => (
  <div className="grid grid-cols-7 gap-px" data-testid="calendar-skeleton-month">
    {Array.from({ length: 42 }, (_, cell) => (
      <Skeleton key={cell} className="aspect-square w-full" />
    ))}
  </div>
);
