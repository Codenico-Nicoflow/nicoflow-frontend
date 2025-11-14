import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { LazyIcon } from '@/components/LazyIcon';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/useMobile';
import type { IProject } from '@/lib/types';
import type { IconId } from '@/lib/utils';

const Project = ({ project }: { project: IProject }) => {
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `project-${project.id}`,
    data: {
      type: 'project',
      project,
    },
  });

  return (
    <SidebarMenuItem
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0 : 1,
        touchAction: 'none',
        userSelect: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
        <SidebarMenuButton
          asChild
          className="hover:bg-primary/10 hover:shadow-sm transition-all duration-300 group rounded-xl px-3 py-2.5"
        >
          <Button
            onClick={e => {
              if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
              } else {
                navigate(`/projects/${project.id}`);
                if (isMobile) {
                  setOpenMobile(false);
                }
              }
            }}
            variant="ghost"
            className="hover:bg-primary/10 hover:shadow-sm transition-all duration-300 group rounded-xl px-3 py-2.5"
          >
            <div className="flex items-center justify-between w-full draggable-project">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <LazyIcon
                  className="w-4 h-4 text-primary group-hover:text-primary/80 transition-colors"
                  iconId={(project.icon as IconId) || 'folder'}
                />
                <span className="text-sm font-medium text-foreground group-hover:text-foreground/90 transition-colors truncate">
                  {project.name}
                </span>
              </div>
              {project.isFavorite && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="ml-2 flex-shrink-0"
                >
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/30 group-hover:fill-yellow-500/50 transition-all duration-300" />
                </motion.div>
              )}
            </div>
          </Button>
        </SidebarMenuButton>
      </motion.div>
    </SidebarMenuItem>
  );
};

export default Project;
