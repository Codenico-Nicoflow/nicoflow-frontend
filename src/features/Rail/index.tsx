import { useTranslation } from 'react-i18next';
import { useLocation, useMatch } from 'react-router-dom';

import { TooltipProvider } from '@/components/ui/tooltip';
import { useDayChange } from '@/hooks/useDayChange';
import { useGetBucketsQuery, useGetProjectsQuery, useGetTimeSpreadQuery } from '@/lib/store';
import { cn } from '@/lib/utils';

import { RailFavorite } from './components/RailFavorite';
import { RailItem } from './components/RailItem';
import { RailToggle } from './components/RailToggle';
import { RailTree } from './components/RailTree';
import { isActive, NAV_DESTINATIONS, SETTINGS_DESTINATION } from './data';
import { selectFavorites } from './favorites';
import { useRailState } from './useRailState';

export const Rail = () => {
  const { t } = useTranslation('nav');
  const { pathname } = useLocation();
  const projectMatch = useMatch('/projects/:projectId');
  const activeProjectId = projectMatch?.params.projectId;

  const { expanded, closedAreaIds, toggleExpanded, toggleArea } = useRailState();

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
      <nav
        aria-label={t('primary')}
        className={cn(
          'flex shrink-0 flex-col gap-1 overflow-y-auto border-e border-border/60 bg-background py-3 transition-[width] duration-200 ease-out motion-reduce:transition-none',
          expanded ? 'w-64 px-2' : 'w-14 items-center'
        )}
      >
        <ul className={cn('flex w-full flex-col gap-1', !expanded && 'items-center')}>
          {NAV_DESTINATIONS.map(dest => (
            <li key={dest.to} className={cn(expanded && 'w-full')}>
              <RailItem
                dest={dest}
                active={isActive(pathname, dest)}
                expanded={expanded}
                badge={badgeFor(dest.id)}
                // Expanded, the tree below points at the exact project, so Areas
                // steps back to a muted marker instead of competing with it.
                mutedActive={expanded && dest.id === 'areas'}
              />
            </li>
          ))}
        </ul>

        {favorites.length > 0 && (
          <>
            <div
              className={cn('my-1 h-px bg-border/60', expanded ? 'w-full' : 'w-6 self-center')}
              data-testid="rail-favorites-divider"
            />
            <ul className={cn('flex w-full flex-col gap-1', !expanded && 'items-center')}>
              {favorites.map(project => (
                <li key={project.id} className={cn(expanded && 'w-full')}>
                  <RailFavorite project={project} active={pathname === `/projects/${project.id}`} expanded={expanded} />
                </li>
              ))}
            </ul>
          </>
        )}

        {expanded && (
          <>
            <div className="my-1 h-px w-full bg-border/60" />
            <RailTree closedAreaIds={closedAreaIds} activeProjectId={activeProjectId} onToggleArea={toggleArea} />
          </>
        )}

        <div className={cn('mt-auto flex w-full flex-col gap-1 pt-2', !expanded && 'items-center')}>
          <RailItem dest={SETTINGS_DESTINATION} active={isActive(pathname, SETTINGS_DESTINATION)} expanded={expanded} />
          <RailToggle expanded={expanded} onToggle={toggleExpanded} />
        </div>
      </nav>
    </TooltipProvider>
  );
};
