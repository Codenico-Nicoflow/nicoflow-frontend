import { useState } from 'react';

import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { isActive, OVERFLOW_DESTINATIONS, PRIMARY_DESTINATIONS } from '@/features/Rail/data';
import { useIsPro } from '@/hooks';
import { useGetBucketsQuery, useGetTimeSpreadQuery } from '@/lib/store';
import { cn } from '@/lib/utils';

import { BottomNavItem } from './BottomNavItem';

export const BottomNav = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation('nav');
  const isPro = useIsPro();
  const [moreOpen, setMoreOpen] = useState(false);

  // Same source as Rail: Today's count is what's scheduled for today, Inbox's
  // is unprocessed captures.
  const { data: timeSpread } = useGetTimeSpreadQuery();
  const todayCount = timeSpread?.today.length ?? 0;
  const { data: buckets } = useGetBucketsQuery();
  const inboxCount = buckets?.items.filter(b => !b.processedAt).length ?? 0;

  const badgeFor = (id: string) => {
    if (id === 'today') return todayCount;
    if (id === 'inbox') return inboxCount;
    return undefined;
  };

  // Without this the user loses all sense of place while on Focus or AI, since
  // neither has a cell of its own.
  const overflowActive = OVERFLOW_DESTINATIONS.some(dest => isActive(pathname, dest));

  return (
    <nav
      aria-label={t('primary')}
      // pb keeps the cells clear of the iPhone home indicator; h-16 is the bar
      // itself, so the inset adds to it rather than eating into the touch targets.
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border/60 bg-background pb-[env(safe-area-inset-bottom)]"
    >
      {PRIMARY_DESTINATIONS.map(dest => (
        <BottomNavItem
          key={dest.to}
          dest={dest}
          active={isActive(pathname, dest)}
          locked={dest.proOnly && !isPro}
          badge={badgeFor(dest.id)}
        />
      ))}

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger
          data-testid="bottomnav-more"
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            overflowActive ? 'font-medium text-primary' : 'text-muted-foreground'
          )}
        >
          <span
            className={cn('flex h-7 w-12 items-center justify-center rounded-full', overflowActive && 'bg-primary/15')}
          >
            <MoreHorizontal className="h-5 w-5 shrink-0" />
          </span>
          <span className="max-w-full truncate">{t('more')}</span>
        </SheetTrigger>

        <SheetContent side="bottom" data-testid="bottomnav-more-sheet" className="pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>{t('more')}</SheetTitle>
          </SheetHeader>
          <ul className="flex flex-col gap-1 px-4 pb-4">
            {OVERFLOW_DESTINATIONS.map(dest => (
              <li key={dest.to}>
                <BottomNavItem
                  dest={dest}
                  active={isActive(pathname, dest)}
                  locked={dest.proOnly && !isPro}
                  variant="row"
                  onNavigate={() => setMoreOpen(false)}
                />
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </nav>
  );
};
