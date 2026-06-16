import { useState } from 'react';

import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

import { LazyIcon } from '@/components';
import { AreaContextMenu } from '@/features/Area/components/AreaContextMenu';
import { AreaDialog } from '@/features/Area/components/AreaDialog';
import { GENERAL_AREA, type IArea } from '@/lib/types';
import type { IconId } from '@/lib/utils';
import { capitalize, cn } from '@/lib/utils';

import Project from '../Project';

interface AreaSectionProps {
  area: IArea;
  isCollapsed: boolean;
  onToggleArea: (areaId: string) => void;
  areaIndex: number;
  isAreaCollapsed: boolean;
}

const AreaSection = ({ area, isCollapsed, onToggleArea, areaIndex, isAreaCollapsed }: AreaSectionProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const projects = area.projects ?? [];
  const color = area.color || 'var(--primary)';
  const isExpanded = !isAreaCollapsed;

  const { isOver, setNodeRef } = useDroppable({ id: `area-${area.id}` });

  if (isCollapsed) return null;

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: areaIndex * 0.04 }}
      className={cn(
        'group/area relative rounded-lg transition-colors',
        isOver && 'bg-primary/5 ring-1 ring-primary/30'
      )}
    >
      {/* color rail */}
      <span
        aria-hidden
        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />

      <button
        type="button"
        onClick={() => onToggleArea(area.id)}
        className="flex w-full items-center gap-2 rounded-lg py-1.5 pl-3 pr-1.5 text-left hover:bg-muted/50 transition-colors"
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
        />
        <LazyIcon iconId={(area.icon as IconId) || 'briefcase'} className="h-4 w-4 shrink-0" style={{ color }} />
        <span className="flex-1 min-w-0 truncate text-sm font-medium text-foreground">{capitalize(area.name)}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{projects.length}</span>
        {area.name !== GENERAL_AREA && (
          <span className="shrink-0 opacity-0 transition-opacity group-hover/area:opacity-100 focus-within:opacity-100">
            <AreaContextMenu area={area} onEdit={() => setIsEditDialogOpen(true)} />
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="ml-[1.45rem] flex flex-col gap-0.5 border-l border-border/60 pb-1 pl-2">
              {projects.length === 0 ? (
                <p className="px-2 py-1 text-xs text-muted-foreground/70">No projects</p>
              ) : (
                projects.map(project => <Project key={project.id} project={project} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AreaDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        area={area}
        onSuccess={() => setIsEditDialogOpen(false)}
      />
    </motion.div>
  );
};

export default AreaSection;
