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
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { LazyIcon } from '@/components';
import { categoryApi, invalidateApiTags, useUpdateProjectMutation } from '@/lib/store';
import type { IProject } from '@/lib/types';
import type { IconId } from '@/lib/utils';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

export const DragAndDropContext = ({ children }: { children: React.ReactNode }) => {
  const [updateProject] = useUpdateProjectMutation();
  const dispatch = useDispatch();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<IProject | null>(null);

  const resetActiveState = () => {
    setActiveId(null);
    setActiveProject(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveProject(event.active.data.current?.project);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      resetActiveState();
      return;
    }

    if (active.id === over.id) {
      resetActiveState();
      return;
    }

    const activeIdValue = active.id.toString();
    const overIdValue = over.id.toString();

    try {
      if (activeIdValue.startsWith('project-') && overIdValue.startsWith('category-')) {
        const projectId = Number(activeIdValue.replace('project-', ''));
        const targetCategoryId = Number(overIdValue.replace('category-', ''));

        if (Number.isNaN(projectId) || Number.isNaN(targetCategoryId)) {
          showErrorToast(ToastMessages.INVALID_DROP_TARGET, toast);
          return;
        }

        const projectData = active.data.current?.project;
        const currentCategoryId = projectData?.categoryId;

        if (currentCategoryId === targetCategoryId) {
          return;
        }

        await updateProject({
          id: projectId,
          body: { categoryId: targetCategoryId },
        }).unwrap();

        invalidateApiTags(dispatch, categoryApi, ['Category'] as const);

        showSuccessToast(ToastMessages.PROJECT_MOVED, toast);
      } else {
        showErrorToast(ToastMessages.INVALID_DROP_TARGET, toast);
      }
    } catch (error) {
      showErrorToast(error, toast);
    } finally {
      resetActiveState();
    }
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
