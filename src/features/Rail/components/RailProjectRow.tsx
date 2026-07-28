import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { LazyIcon } from '@/components';
import type { IconId, IProject } from '@/lib/types';
import { cn } from '@/lib/utils';

export const RailProjectRow = ({ project, active }: { project: IProject; active: boolean }) => (
  <li>
    <Link
      to={`/projects/${project.id}`}
      aria-current={active ? 'page' : undefined}
      data-testid={`rail-project-${project.id}`}
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-md ps-9 pe-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      <LazyIcon iconId={(project.folderIcon as IconId) || 'folder'} className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{project.name}</span>
      {/* Starred projects also appear in the favorites strip above; the star
          marks them as the same thing rather than a second, unrelated entry. */}
      {project.isFavorite && <Star className="h-3 w-3 shrink-0 fill-current text-amber-500" aria-hidden />}
    </Link>
  </li>
);
