import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

export const RailToggle = ({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) => {
  const { t, i18n } = useTranslation('nav');
  const isRtl = i18n.dir() === 'rtl';
  // The chevron points the way the rail will move, which flips with direction.
  const Icon = expanded === isRtl ? ChevronRight : ChevronLeft;
  const label = t(expanded ? 'collapseRail' : 'expandRail');

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={expanded}
      data-testid="rail-toggle"
      className={cn(
        'flex h-10 items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        expanded ? 'w-full gap-3 px-3' : 'w-10 justify-center'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {expanded && <span className="flex-1 truncate text-start text-sm">{label}</span>}
    </button>
  );
};
