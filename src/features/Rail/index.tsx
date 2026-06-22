import { Link, useLocation } from 'react-router-dom';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { isActive, NAV_DESTINATIONS, type NavDestination, SETTINGS_DESTINATION } from './data';

const RailItem = ({ dest, active }: { dest: NavDestination; active: boolean }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        to={dest.to}
        aria-label={dest.label}
        aria-current={active ? 'page' : undefined}
        data-testid={`rail-${dest.label.toLowerCase()}`}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <dest.icon className="h-5 w-5" />
      </Link>
    </TooltipTrigger>
    <TooltipContent side="right">{dest.label}</TooltipContent>
  </Tooltip>
);

export const Rail = () => {
  const { pathname } = useLocation();

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border/60 bg-background py-3">
        {NAV_DESTINATIONS.map(dest => (
          <RailItem key={dest.to} dest={dest} active={isActive(pathname, dest)} />
        ))}
        <div className="mt-auto">
          <RailItem dest={SETTINGS_DESTINATION} active={isActive(pathname, SETTINGS_DESTINATION)} />
        </div>
      </aside>
    </TooltipProvider>
  );
};
