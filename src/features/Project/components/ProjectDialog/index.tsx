import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import type { IProject } from '@nicoflow/shared/types';
import { FolderKanban, FolderOpen, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import {
  CheckboxField,
  CustomDialog,
  DescriptionField,
  DialogFieldGrid,
  DueDateField,
  FormDialog,
  IconField,
  NameField,
  PlanLimitAlert,
} from '@/components';
import { Form } from '@/components/ui/form.tsx';
import { canFavoriteMore } from '@/features/Rail/favorites';
import {
  areaApi,
  invalidateApiTags,
  projectApi,
  useCreateProjectMutation,
  useGetAreasQuery,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from '@/lib/store';
import type { ProjectFormData } from '@/lib/utils';
import {
  getApiErrorCode,
  hasFormChanges,
  projectSchema,
  showErrorToast,
  showSuccessToast,
  ToastMessages,
} from '@/lib/utils';

import { ProjectAreaField } from '../ProjectAreaField';
import { ProjectStatusField } from '../ProjectStatusField';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: IProject;
  onSuccess?: () => void;
  /** Invoked when the user has no areas and chooses to create one first. */
  onCreateArea?: () => void;
  /** Pre-selects an area in create mode (e.g. "Add project" inside an area card). */
  defaultAreaId?: string;
}

export const ProjectDialog = ({
  open,
  onOpenChange,
  project,
  onSuccess,
  onCreateArea,
  defaultAreaId,
}: ProjectDialogProps) => {
  const { t } = useTranslation(['project', 'common']);
  const isEditMode = !!project;

  const [createProject, { isLoading: isCreateLoading }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdateLoading }] = useUpdateProjectMutation();
  const { data: areasData, isLoading: isAreasLoading } = useGetAreasQuery();
  const areas = useMemo(() => areasData?.items ?? [], [areasData]);
  const { data: projectsData } = useGetProjectsQuery();
  const dispatch = useDispatch();
  const [planLimitHit, setPlanLimitHit] = useState(false);

  // A project must belong to an area; block the form entirely when none exist.
  const hasNoAreas = !isEditMode && !isAreasLoading && areas.length === 0;

  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: project?.name || '',
      areaId: project?.areaId ?? defaultAreaId ?? areas[0]?.id ?? undefined,
      folderIcon: (project?.folderIcon as ProjectFormData['folderIcon']) || 'folder',
      status: project?.status || 'active',
      isFavorite: project?.isFavorite || false,
      dueDate: project?.dueDate ? new Date(project.dueDate) : undefined,
      description: project?.description ?? '',
    },
    resolver: zodResolver(projectSchema),
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        areaId: project.areaId,
        folderIcon: project.folderIcon as ProjectFormData['folderIcon'],
        status: project.status,
        isFavorite: project.isFavorite ?? false,
        dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
        description: project.description ?? '',
      });
    }
  }, [project, form]);

  useEffect(() => {
    if (!project && areas.length > 0 && !form.getValues('areaId')) {
      const fallbackAreaId = defaultAreaId ?? areas[0]?.id;
      if (fallbackAreaId) form.setValue('areaId', fallbackAreaId);
    }
  }, [areas, project, form, defaultAreaId]);

  useEffect(() => {
    if (!open) {
      setPlanLimitHit(false);
    }
  }, [open]);

  const hasChanges = hasFormChanges(isEditMode, project, watchedValues as Partial<IProject>, [
    'name',
    'areaId',
    'folderIcon',
    'status',
    'dueDate',
    'isFavorite',
    'description',
  ]);

  const onSubmit = async (data: ProjectFormData) => {
    if (isEditMode && !hasChanges) {
      onOpenChange(false);
      return;
    }

    setPlanLimitHit(false);

    // Newly starring here counts against the same cap the rail enforces.
    if (data.isFavorite && !project?.isFavorite && !canFavoriteMore(projectsData?.items ?? [])) {
      toast.error(ToastMessages.FAVORITE_LIMIT_REACHED);
      return;
    }

    try {
      if (isEditMode) {
        await updateProject({
          id: project.id,
          name: data.name,
          areaId: data.areaId,
          status: data.status,
          folderIcon: data.folderIcon,
          dueDate: data.dueDate instanceof Date ? data.dueDate.toISOString() : null,
          isFavorite: data.isFavorite,
          description: data.description?.trim() ? data.description.trim() : null,
        }).unwrap();
        invalidateApiTags(dispatch, projectApi, ['Project']);
        invalidateApiTags(dispatch, areaApi, ['Area']);
        showSuccessToast(ToastMessages.PROJECT_UPDATED, toast);
      } else {
        await createProject({
          areaId: data.areaId,
          name: data.name,
          status: data.status,
          folderIcon: data.folderIcon,
          dueDate: data.dueDate instanceof Date ? data.dueDate.toISOString() : undefined,
          isFavorite: data.isFavorite,
          description: data.description?.trim() ? data.description.trim() : undefined,
        }).unwrap();
        invalidateApiTags(dispatch, projectApi, ['Project']);
        invalidateApiTags(dispatch, areaApi, ['Area']);
        showSuccessToast(ToastMessages.PROJECT_CREATED, toast);
      }
      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
        setPlanLimitHit(true);
      }
      showErrorToast(error, toast);
    }
  };

  if (hasNoAreas) {
    return (
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('project:dialog.noAreaTitle')}
        description={t('project:dialog.noAreaDescription')}
        data-testid="project-needs-area-dialog"
        cancelButton={{ text: t('common:actions.cancel'), onClick: () => onOpenChange(false) }}
        acceptButton={
          onCreateArea
            ? {
                text: t('project:dialog.createAreaButton'),
                onClick: () => {
                  onOpenChange(false);
                  onCreateArea();
                },
              }
            : undefined
        }
      />
    );
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? t('project:dialog.editTitle') : t('project:dialog.createTitle')}
      description={isEditMode ? t('project:dialog.editDescription') : t('project:dialog.createDescription')}
      icon={FolderKanban}
      isEditMode={isEditMode}
      isLoading={isCreateLoading || isUpdateLoading || isAreasLoading}
      hasChanges={hasChanges}
      onSubmit={form.handleSubmit(onSubmit)}
      maxWidth="xl"
    >
      <Form {...form}>
        <div className="space-y-4">
          {planLimitHit && <PlanLimitAlert />}
          <NameField
            control={form.control}
            label={t('project:dialog.nameLabel')}
            icon={FolderOpen}
            placeholder={t('project:dialog.namePlaceholder')}
            delay={0.1}
          />

          <DialogFieldGrid columns={2}>
            <ProjectAreaField control={form.control} />
            <IconField
              control={form.control}
              fieldName="folderIcon"
              label={t('project:dialog.iconLabel')}
              delay={0.25}
            />
          </DialogFieldGrid>

          {isEditMode && <ProjectStatusField control={form.control} />}

          <DescriptionField
            control={form.control}
            label={t('project:dialog.descriptionLabel')}
            placeholder={t('project:dialog.descriptionPlaceholder')}
            optional
            delay={0.3}
          />

          <DueDateField control={form.control} optional delay={0.35} />
          <CheckboxField
            control={form.control}
            label={t('project:dialog.favoriteLabel')}
            description={t('project:dialog.favoriteDescription')}
            icon={Star}
            fieldName="isFavorite"
            delay={0.4}
          />
        </div>
      </Form>
    </FormDialog>
  );
};
