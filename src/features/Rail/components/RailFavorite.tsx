import type { IconId, IProject } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { LazyIcon } from '@/components';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Favorites render their project's folderIcon (an IconId string via LazyIcon),
// not a LucideIcon component — so they can't reuse RailItem. Active state is a
// ring rather than a fill, so a favorite and the section-level Areas item can
// both read as active without looking like two competing selections.
export const RailFavorite = ({
  project,
  active,
  expanded,
}: {
  project: IProject;
  active: boolean;
  expanded: boolean;
}) => {
  const { i18n } = useTranslation('nav');
  const side = i18n.dir() === 'rtl' ? 'left' : 'right';

  const link = (
    <Link
      to={`/projects/${project.id}`}
      aria-label={expanded ? undefined : project.name}
      aria-current={active ? 'page' : undefined}
      data-testid={`rail-favorite-${project.id}`}
      className={cn(
        'flex items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        expanded ? 'h-9 w-full gap-3 px-3' : 'h-9 w-9 justify-center',
        active ? 'text-primary ring-2 ring-primary/60' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      <LazyIcon iconId={(project.folderIcon as IconId) || 'folder'} className="h-4 w-4 shrink-0" />
      {expanded && <span className="flex-1 truncate text-sm">{project.name}</span>}
    </Link>
  );

  if (expanded) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side={side}>{project.name}</TooltipContent>
    </Tooltip>
  );
};
