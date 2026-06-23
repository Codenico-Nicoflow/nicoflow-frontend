import { useState } from 'react';

import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { ConfirmDialog, ItemActionsMenu, LazyIcon } from '@/components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AreaDialog } from '@/features/Area/components/AreaDialog';
import { ProjectDeleteDialog, ProjectDialog, ProjectRow } from '@/features/Project';
import { areaApi, invalidateApiTags, useDeleteAreaMutation } from '@/lib/store';
import type { AreaWithProjects } from '@/lib/store/slices/area/type';
import type { IconId, IProject } from '@/lib/types';
import { GENERAL_AREA } from '@/lib/types';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

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

  const isGeneral = area.name.toLowerCase() === GENERAL_AREA;
  const projects = area.projects ?? [];

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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.3 }}
        whileHover={{ y: -2 }}
      >
        <Card className="border-t-4 overflow-hidden" style={{ borderTopColor: area.color }} data-testid={testId}>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
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
              data-testid={testId ? `${testId}-actions` : 'area-card-actions'}
              actions={[
                { label: t('contextMenu.edit'), icon: Pencil, onClick: () => setEditAreaOpen(true) },
                {
                  label: t('contextMenu.delete'),
                  icon: Trash2,
                  onClick: () => setConfirmDeleteArea(true),
                  destructive: true,
                  disabled: isGeneral,
                },
              ]}
            />
          </CardHeader>

          <CardContent className="space-y-1">
            {projects.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">{t('card.noProjects')}</p>
            ) : (
              projects.map(project => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={() => setEditProject(project)}
                  onDelete={() => setDeleteProject(project)}
                />
              ))
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
