import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { LazyIcon } from '@/components';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDayChange } from '@/hooks/useDayChange';
import { useGetBucketsQuery, useGetProjectsQuery, useGetTimeSpreadQuery } from '@/lib/store';
import type { IconId, IProject } from '@/lib/types';
import { cn } from '@/lib/utils';

import { isActive, NAV_DESTINATIONS, type NavDestination, SETTINGS_DESTINATION } from './data';
import { selectFavorites } from './favorites';

const RailItem = ({ dest, active, badge }: { dest: NavDestination; active: boolean; badge?: number }) => {
  const { t, i18n } = useTranslation('nav');
  const label = t(dest.labelKey);
  // The rail hugs the inline-start edge, so its tooltip opens toward the content
  // (the inline-end side) — which is 'left' in RTL and 'right' in LTR.
  const side = i18n.dir() === 'rtl' ? 'left' : 'right';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={dest.to}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          data-testid={`rail-${dest.id}`}
          className={cn(
            'relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
            active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          )}
        >
          <dest.icon className="h-5 w-5" />
          {badge !== undefined && badge > 0 && (
            <span
              data-testid={`rail-${dest.id}-badge`}
              className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            >
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
};

// Favorites render their project's folderIcon (an IconId string via LazyIcon),
// not a LucideIcon component — so they can't reuse RailItem. Active state is a
// ring rather than a fill, so a favorite and the section-level Areas item can
// both read as active without looking like two competing selections.
const RailFavorite = ({ project, active }: { project: IProject; active: boolean }) => {
  const { i18n } = useTranslation('nav');
  const side = i18n.dir() === 'rtl' ? 'left' : 'right';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={`/projects/${project.id}`}
          aria-label={project.name}
          aria-current={active ? 'page' : undefined}
          data-testid={`rail-favorite-${project.id}`}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
            active
              ? 'text-primary ring-2 ring-primary/60'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          )}
        >
          <LazyIcon iconId={(project.folderIcon as IconId) || 'folder'} className="h-4 w-4" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side={side}>{project.name}</TooltipContent>
    </Tooltip>
  );
};

export const Rail = () => {
  const { pathname } = useLocation();
  // The Today rail item carries a count of what's scheduled for today.
  const { data: timeSpread, refetch: refetchTimeSpread } = useGetTimeSpreadQuery();
  const todayCount = timeSpread?.today.length ?? 0;

  // The Today badge + Time Spread buckets are computed against the local calendar
  // day. The rail is always mounted, so refetching here on midnight rollover keeps
  // both fresh even when the app was left open on another page for days. The Time
  // Spread view reads the same cache entry, so it updates with the badge.
  useDayChange(refetchTimeSpread);

  // The Inbox rail item carries a count of unprocessed captures.
  const { data: buckets } = useGetBucketsQuery();
  const inboxCount = buckets?.items.filter(b => !b.processedAt).length ?? 0;

  // Starred projects get a one-click shortcut under the primary destinations.
  const { data: projectsData } = useGetProjectsQuery();
  const favorites = selectFavorites(projectsData?.items ?? []);

  const badgeFor = (id: string) => {
    if (id === 'today') return todayCount;
    if (id === 'inbox') return inboxCount;
    return undefined;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-e border-border/60 bg-background py-3">
        {NAV_DESTINATIONS.map(dest => (
          <RailItem key={dest.to} dest={dest} active={isActive(pathname, dest)} badge={badgeFor(dest.id)} />
        ))}

        {favorites.length > 0 && (
          <>
            <div className="my-1 h-px w-6 bg-border/60" data-testid="rail-favorites-divider" />
            {favorites.map(project => (
              <RailFavorite key={project.id} project={project} active={pathname === `/projects/${project.id}`} />
            ))}
          </>
        )}

        <div className="mt-auto">
          <RailItem dest={SETTINGS_DESTINATION} active={isActive(pathname, SETTINGS_DESTINATION)} />
        </div>
      </aside>
    </TooltipProvider>
  );
};
