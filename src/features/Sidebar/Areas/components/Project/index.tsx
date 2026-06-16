import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { LazyIcon } from '@/components';
import { useSidebar } from '@/components/ui/sidebar.tsx';
import { useIsMobile } from '@/hooks/useMobile.ts';
import type { IProject } from '@/lib/types';
import type { IconId } from '@/lib/utils';
import { cn } from '@/lib/utils';

const Project = ({ project }: { project: IProject }) => {
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `project-${project.id}`,
    data: { type: 'project', project },
  });

  const handleClick = () => {
    if (isDragging) return;
    navigate(`/projects/${project.id}`);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={handleClick}
      style={{ transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        'group/project flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left',
        'touch-none select-none hover:bg-muted/50 transition-colors'
      )}
      {...attributes}
      {...listeners}
    >
      <LazyIcon
        iconId={(project.folderIcon as IconId) || 'folder'}
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover/project:text-foreground transition-colors"
      />
      <span className="flex-1 min-w-0 truncate text-sm text-foreground/90">{project.name}</span>
      {project.isFavorite && <Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />}
    </button>
  );
};

export default Project;
