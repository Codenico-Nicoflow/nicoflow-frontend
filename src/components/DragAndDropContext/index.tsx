import { useState } from 'react';

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { LazyIcon } from '@/components';
import {
  useGetAreasWithProjectsQuery,
  useReorderAreasMutation,
  useReorderProjectsMutation,
  useUpdateProjectMutation,
} from '@/lib/store';
import type { IProject } from '@/lib/types';
import type { IconId } from '@/lib/utils';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

import { resolveDragEnd } from './resolveDragEnd';

export const DragAndDropContext = ({ children }: { children: React.ReactNode }) => {
  const { data: areas } = useGetAreasWithProjectsQuery();
  const [updateProject] = useUpdateProjectMutation();
  const [reorderProjects] = useReorderProjectsMutation();
  const [reorderAreas] = useReorderAreasMutation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<IProject | null>(null);

  const resetActiveState = () => {
    setActiveId(null);
    setActiveProject(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveProject(event.active.data.current?.project ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    resetActiveState();
    const { active, over } = event;
    const action = resolveDragEnd(active.id?.toString(), over?.id?.toString(), areas ?? []);

    try {
      switch (action.kind) {
        case 'move-project':
          await updateProject({ id: action.projectId, areaId: action.targetAreaId }).unwrap();
          showSuccessToast(ToastMessages.PROJECT_MOVED, toast);
          break;
        case 'reorder-projects':
          // Optimistic cache update + rollback live in the mutation's onQueryStarted.
          await reorderProjects({ items: action.items }).unwrap();
          break;
        case 'reorder-areas':
          await reorderAreas({ items: action.items }).unwrap();
          break;
        case 'noop':
          break;
      }
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 10 } });
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const sensors = useSensors(pointerSensor, mouseSensor, touchSensor);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
      {children}
      <DragOverlay dropAnimation={null}>
        {activeId && activeProject ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 3 }}
            exit={{ opacity: 0, scale: 0.95, rotate: -3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg p-3 shadow-lg max-w-xs cursor-grab touch-none select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <LazyIcon
                  iconId={(activeProject.folderIcon as IconId) || 'folder'}
                  className="w-4 h-4 text-primary-foreground"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-primary">{activeProject.name}</div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
