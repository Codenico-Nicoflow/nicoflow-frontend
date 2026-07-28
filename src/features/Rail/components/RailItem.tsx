import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { NavDestination } from '../data';

type RailItemProps = {
  dest: NavDestination;
  active: boolean;
  expanded: boolean;
  badge?: number;
  /** Renders the active state as a muted marker instead of a fill. Used for
   *  Areas when expanded: the tree below already shows the exact project, so a
   *  second full-strength highlight competes with it. */
  mutedActive?: boolean;
};

const Badge = ({ id, count, className }: { id: string; count: number; className?: string }) => (
  <span
    data-testid={`rail-${id}-badge`}
    className={cn(
      'flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground',
      className
    )}
  >
    {count > 9 ? '9+' : count}
  </span>
);

export const RailItem = ({ dest, active, expanded, badge, mutedActive }: RailItemProps) => {
  const { t, i18n } = useTranslation('nav');
  const label = t(dest.labelKey);
  // The rail hugs the inline-start edge, so its tooltip opens toward the content
  // (the inline-end side) — which is 'left' in RTL and 'right' in LTR.
  const side = i18n.dir() === 'rtl' ? 'left' : 'right';
  const showBadge = badge !== undefined && badge > 0;

  const link = (
    <Link
      to={dest.to}
      aria-label={expanded ? undefined : label}
      aria-current={active ? 'page' : undefined}
      data-testid={`rail-${dest.id}`}
      className={cn(
        'relative flex items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        expanded ? 'h-10 w-full gap-3 px-3' : 'h-10 w-10 justify-center',
        active
          ? mutedActive
            ? 'text-foreground'
            : 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      <dest.icon className="h-5 w-5 shrink-0" />
      {expanded && <span className="flex-1 truncate text-sm">{label}</span>}
      {showBadge && <Badge id={dest.id} count={badge} className={cn(!expanded && 'absolute -top-0.5 -end-0.5')} />}
    </Link>
  );

  // Expanded rows show their label, so a tooltip repeating it would be a
  // duplicate accessible name rather than added information.
  if (expanded) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
};
