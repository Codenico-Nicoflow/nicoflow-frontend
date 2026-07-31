import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { NavDestination } from '@/features/Rail/data';
import { cn } from '@/lib/utils';

type BottomNavItemProps = {
  dest: NavDestination;
  active: boolean;
  /** Pro-gated for this user: shows a lock, still navigates (the page teases). */
  locked?: boolean;
  /** Sheet rows are a labelled list; bar cells stack the label under the icon. */
  variant?: 'cell' | 'row';
  onNavigate?: () => void;
};

export const BottomNavItem = ({ dest, active, locked, variant = 'cell', onNavigate }: BottomNavItemProps) => {
  const { t } = useTranslation('nav');
  const { t: tTask } = useTranslation('task');
  const label = t(dest.labelKey);
  const isRow = variant === 'row';

  return (
    <Link
      to={dest.to}
      onClick={onNavigate}
      // The lock is part of the destination's meaning, so it belongs in the
      // accessible name — a sighted user sees the icon, everyone else hears it.
      aria-label={locked ? `${label} (${tTask('calendar.lockedHint')})` : undefined}
      aria-current={active ? 'page' : undefined}
      data-testid={`bottomnav-${dest.id}`}
      className={cn(
        'flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        isRow ? 'w-full gap-3 rounded-lg px-3 py-3 text-sm' : 'flex-1 flex-col justify-center gap-0.5 px-1 text-xs',
        active ? 'font-medium text-primary' : 'text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'relative flex items-center justify-center',
          // Colour alone can't carry the active state (WCAG 1.4.1), so the icon
          // also gains a filled pill behind it.
          !isRow && 'h-7 w-12 rounded-full',
          !isRow && active && 'bg-primary/15'
        )}
      >
        <dest.icon className={cn('h-5 w-5 shrink-0', active && 'fill-current/20')} />
        {locked && (
          <Lock
            className="absolute -bottom-0.5 -end-1 h-3 w-3 text-muted-foreground"
            aria-hidden
            data-testid={`bottomnav-${dest.id}-lock`}
          />
        )}
      </span>
      <span className={cn(!isRow && 'max-w-full truncate')}>{label}</span>
    </Link>
  );
};
