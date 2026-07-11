import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { isActive, NAV_DESTINATIONS } from '@/features/Rail/data';
import { cn } from '@/lib/utils';

const ITEMS = [...NAV_DESTINATIONS];

export const BottomNav = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation('nav');

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border/60 bg-background">
      {ITEMS.map(dest => {
        const active = isActive(pathname, dest);
        const label = t(dest.labelKey);
        return (
          <Link
            key={dest.to}
            to={dest.to}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            data-testid={`bottomnav-${dest.id}`}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <dest.icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};
