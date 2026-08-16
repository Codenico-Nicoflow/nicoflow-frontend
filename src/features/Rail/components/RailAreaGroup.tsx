import { useId } from 'react';

import type { AreaWithProjects } from '@nicoflow/shared/api';
import type { IconId } from '@nicoflow/shared/types';
import { ChevronDown } from 'lucide-react';

import { LazyIcon } from '@/components';
import { cn } from '@/lib/utils';

import { selectTreeProjects } from '../tree';

import { RailProjectRow } from './RailProjectRow';

type RailAreaGroupProps = {
  area: AreaWithProjects;
  open: boolean;
  activeProjectId?: string;
  onToggle: (areaId: string) => void;
};

export const RailAreaGroup = ({ area, open, activeProjectId, onToggle }: RailAreaGroupProps) => {
  const listId = useId();
  const projects = selectTreeProjects(area.projects ?? []);

  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(area.id)}
        aria-expanded={open}
        aria-controls={listId}
        data-testid={`rail-area-${area.id}`}
        className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
            !open && '-rotate-90 rtl:rotate-90'
          )}
          aria-hidden
        />
        <LazyIcon
          iconId={(area.icon as IconId) || 'folder'}
          className="h-4 w-4 shrink-0"
          style={area.color ? { color: area.color } : undefined}
        />
        <span className="flex-1 truncate text-start font-medium">{area.name}</span>
      </button>

      <ul id={listId} hidden={!open} className="mt-0.5 space-y-0.5">
        {projects.map(project => (
          <RailProjectRow key={project.id} project={project} active={project.id === activeProjectId} />
        ))}
      </ul>
    </li>
  );
};
