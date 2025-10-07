import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useUpdateProjectMutation, categoryApi } from '@my-monorepo/store';
import { useDispatch } from 'react-redux';
import { showSuccessToast, showErrorToast, ToastMessages } from '@my-monorepo/utils';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LazyIcon } from '@/components/LazyIcon';
import type { IconId } from '@my-monorepo/utils';
import type { IProject } from '@my-monorepo/types';
import { toast } from 'sonner';

const DragAndDropContext = ({ children }: { children: React.ReactNode }) => {
  const [updateProject] = useUpdateProjectMutation();
  const dispatch = useDispatch();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<IProject | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveProject(event.active.data.current?.project);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    if (active.id.toString().startsWith('project-') && over.id.toString().startsWith('category-')) {
      const projectId = parseInt(active.id.toString().replace('project-', ''));
      const targetCategoryId = parseInt(over.id.toString().replace('category-', ''));

      const projectData = active.data.current?.project;
      const currentCategoryId = projectData?.categoryId;

      if (currentCategoryId === targetCategoryId) {
        return;
      }

      try {
        await updateProject({
          id: projectId,
          body: { categoryId: targetCategoryId },
        }).unwrap();

        dispatch(categoryApi.util.invalidateTags(['Category']));

        showSuccessToast(ToastMessages.PROJECT_MOVED, toast);
      } catch (error) {
        showErrorToast(error, toast);
      }
    } else {
      showErrorToast(ToastMessages.INVALID_DROP_TARGET, toast);
    }

    setActiveId(null);
    setActiveProject(null);
  };

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 10,
    },
  });

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  const sensors = useSensors(pointerSensor, mouseSensor, touchSensor);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
      {children}
      <DragOverlay>
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
                  iconId={(activeProject.icon as IconId) || 'folder'}
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

export default DragAndDropContext;
