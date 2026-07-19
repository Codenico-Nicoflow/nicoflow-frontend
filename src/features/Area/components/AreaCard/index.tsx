import { useState } from 'react';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { ConfirmDialog, ItemActionsMenu, LazyIcon } from '@/components';
import { areaDragId, projectDragId } from '@/components/DragAndDropContext/resolveDragEnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AreaDialog } from '@/features/Area/components/AreaDialog';
import { ProjectDeleteDialog, ProjectDialog, ProjectRow } from '@/features/Project';
import { areaApi, invalidateApiTags, useDeleteAreaMutation } from '@/lib/store';
import type { AreaWithProjects } from '@/lib/store/slices/area/type';
import type { IconId, IProject } from '@/lib/types';
import { cn, showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

interface AreaCardProps {
  area: AreaWithProjects;
  index?: number;
  'data-testid'?: string;
}

export const AreaCard = ({ area, index = 0, 'data-testid': testId }: AreaCardProps) => {
  const { t } = useTranslation('area');
  const dispatch = useDispatch();
  const [deleteArea, { isLoading: isDeleting }] = useDeleteAreaMutation();

  const [editAreaOpen, setEditAreaOpen] = useState(false);
  const [confirmDeleteArea, setConfirmDeleteArea] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [editProject, setEditProject] = useState<IProject | undefined>();
  const [deleteProject, setDeleteProject] = useState<IProject | undefined>();

  const projects = area.projects ?? [];

  // The card is sortable (area reorder) and a drop target for projects moved
  // from other areas. dnd-kit ids carry the area-/project- prefixes.
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: areaDragId(area.id),
    data: { area },
  });
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: areaDragId(area.id), data: { area } });
  const cardStyle = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderTopColor: area.color,
  };

  const handleDeleteArea = async () => {
    try {
      await deleteArea(area.id).unwrap();
      invalidateApiTags(dispatch, areaApi, ['Area'] as const);
      showSuccessToast(ToastMessages.AREA_DELETED, toast);
      setConfirmDeleteArea(false);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <>
      <motion.div
        ref={node => {
          setSortableRef(node);
          setDroppableRef(node);
        }}
        style={cardStyle}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.3 }}
        whileHover={{ y: -2 }}
      >
        <Card
          className={cn('border-t-4 overflow-hidden', isOver && 'ring-2 ring-primary ring-offset-2')}
          data-testid={testId}
        >
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t('card.dragHandle')}
                    className="shrink-0 cursor-grab text-muted-foreground touch-none"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('card.dragHandle')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${area.color}1A` }}
            >
              <LazyIcon iconId={(area.icon as IconId) || 'folder'} className="h-5 w-5" style={{ color: area.color }} />
            </span>
            <span className="flex-1 min-w-0 truncate font-semibold text-foreground">{area.name}</span>
            <Badge variant="secondary" className="shrink-0">
              {projects.length}
            </Badge>
            <ItemActionsMenu
              triggerLabel={t('card.actionsMenu')}
              data-testid={testId ? `${testId}-actions` : 'area-card-actions'}
              actions={[
                { label: t('contextMenu.edit'), icon: Pencil, onClick: () => setEditAreaOpen(true) },
                {
                  label: t('contextMenu.delete'),
                  icon: Trash2,
                  onClick: () => setConfirmDeleteArea(true),
                  destructive: true,
                },
              ]}
            />
          </CardHeader>

          <CardContent className="space-y-1">
            {projects.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">{t('card.noProjects')}</p>
            ) : (
              <SortableContext items={projects.map(p => projectDragId(p.id))} strategy={verticalListSortingStrategy}>
                {projects.map(project => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    data-testid={`project-row-${project.id}`}
                    onEdit={() => setEditProject(project)}
                    onDelete={() => setDeleteProject(project)}
                  />
                ))}
              </SortableContext>
            )}

            <Button
              variant="ghost"
              onClick={() => setCreateProjectOpen(true)}
              className="mt-1 w-full justify-start border border-dashed border-border text-muted-foreground hover:text-foreground"
              data-testid={testId ? `${testId}-add-project` : 'area-card-add-project'}
            >
              <Plus className="me-2 h-4 w-4" />
              {t('card.addProject')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <AreaDialog open={editAreaOpen} onOpenChange={setEditAreaOpen} area={area} />
      <ConfirmDialog
        open={confirmDeleteArea}
        onOpenChange={setConfirmDeleteArea}
        title={t('card.confirmDeleteTitle')}
        description={
          <Trans
            t={t}
            i18nKey="card.confirmDeleteDescription"
            values={{ name: area.name }}
            components={{ name: <span className="font-semibold text-foreground" /> }}
          />
        }
        icon={Trash2}
        variant="danger"
        confirmLabel={t('card.confirmDeleteButton')}
        onConfirm={handleDeleteArea}
        isLoading={isDeleting}
        destructive
      />

      <ProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} defaultAreaId={area.id} />
      <ProjectDialog
        open={!!editProject}
        onOpenChange={open => !open && setEditProject(undefined)}
        project={editProject}
      />
      {deleteProject && (
        <ProjectDeleteDialog
          open={!!deleteProject}
          onOpenChange={open => !open && setDeleteProject(undefined)}
          projectId={deleteProject.id}
          projectName={deleteProject.name}
          onSuccess={() => setDeleteProject(undefined)}
        />
      )}
    </>
  );
};
