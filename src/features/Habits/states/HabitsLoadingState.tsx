import { Skeleton } from '@/components/ui/skeleton';

import { HABIT_GRID_CLASSES } from '../data';

// Card-shaped skeletons, never a spinner: the grid's layout is known before the
// data arrives, so the page can hold its shape and avoid the jump that makes a
// load feel slower than it is.
export const HabitsLoadingState = ({ count = 3 }: { count?: number }) => (
  <div className={HABIT_GRID_CLASSES} data-testid="habits-loading">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    ))}
  </div>
);
