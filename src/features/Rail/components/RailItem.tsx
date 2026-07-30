import { Lock } from 'lucide-react';
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
  /** Pro-gated for this user: shows a lock, still navigates (the page teases). */
  locked?: boolean;
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

export const RailItem = ({ dest, active, expanded, badge, mutedActive, locked }: RailItemProps) => {
  const { t, i18n } = useTranslation('nav');
  const { t: tTask } = useTranslation('task');
  const label = t(dest.labelKey);
  // The lock is part of the destination's meaning, so it belongs in the
  // accessible name — a sighted user sees the icon, everyone else hears it.
  const lockedLabel = locked ? `${label} (${tTask('calendar.lockedHint')})` : label;
  // The rail hugs the inline-start edge, so its tooltip opens toward the content
  // (the inline-end side) — which is 'left' in RTL and 'right' in LTR.
  const side = i18n.dir() === 'rtl' ? 'left' : 'right';
  const showBadge = badge !== undefined && badge > 0;

  const link = (
    <Link
      to={dest.to}
      aria-label={expanded && !locked ? undefined : lockedLabel}
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
      {locked && (
        <Lock
          className={cn('h-3 w-3 shrink-0 text-muted-foreground', !expanded && 'absolute -bottom-0.5 -end-0.5')}
          aria-hidden
          data-testid={`rail-${dest.id}-lock`}
        />
      )}
      {showBadge && <Badge id={dest.id} count={badge} className={cn(!expanded && 'absolute -top-0.5 -end-0.5')} />}
    </Link>
  );

  // Expanded rows show their label, so a tooltip repeating it would be a
  // duplicate accessible name rather than added information.
  if (expanded) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side={side}>{lockedLabel}</TooltipContent>
    </Tooltip>
  );
};
