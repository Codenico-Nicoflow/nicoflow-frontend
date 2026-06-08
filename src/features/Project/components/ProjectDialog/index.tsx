import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { FolderKanban, FolderOpen, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import {
  CheckboxField,
  CustomDialog,
  DialogFieldGrid,
  DueDateField,
  FormDialog,
  IconField,
  NameField,
  PlanLimitAlert,
} from '@/components';
import { Form } from '@/components/ui/form.tsx';
import {
  areaApi,
  invalidateApiTags,
  projectApi,
  useCreateProjectMutation,
  useGetAreasQuery,
  useUpdateProjectMutation,
} from '@/lib/store';
import type { IProject } from '@/lib/types';
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
}

export const ProjectDialog = ({ open, onOpenChange, project, onSuccess, onCreateArea }: ProjectDialogProps) => {
  const isEditMode = !!project;

  const [createProject, { isLoading: isCreateLoading }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdateLoading }] = useUpdateProjectMutation();
  const { data: areas, isLoading: isAreasLoading } = useGetAreasQuery();
  const dispatch = useDispatch();
  const [planLimitHit, setPlanLimitHit] = useState(false);

  // A project must belong to an area; block the form entirely when none exist.
  const hasNoAreas = !isEditMode && !isAreasLoading && (!areas || areas.length === 0);

  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: project?.name || '',
      areaId: project?.areaId ?? areas?.[0]?.id ?? undefined,
      folderIcon: (project?.folderIcon as ProjectFormData['folderIcon']) || 'folder',
      status: project?.status || 'active',
      isFavorite: project?.isFavorite || false,
      dueDate: project?.dueDate ? new Date(project.dueDate) : undefined,
    },
    resolver: zodResolver(projectSchema),
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        areaId: project.areaId ?? undefined,
        folderIcon: project.folderIcon as ProjectFormData['folderIcon'],
        status: project.status,
        isFavorite: project.isFavorite ?? false,
        dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
      });
    }
  }, [project, form]);

  useEffect(() => {
    if (!project && areas && areas.length > 0 && !form.getValues('areaId')) {
      form.setValue('areaId', areas[0].id);
    }
  }, [areas, project, form]);

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
  ]);

  const onSubmit = async (data: ProjectFormData) => {
    if (isEditMode && !hasChanges) {
      onOpenChange(false);
      return;
    }

    setPlanLimitHit(false);

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
        title="Create an Area first"
        description="Projects live inside Areas. Create an Area before adding a project."
        data-testid="project-needs-area-dialog"
        cancelButton={{ text: 'Cancel', onClick: () => onOpenChange(false) }}
        acceptButton={
          onCreateArea
            ? {
                text: 'Create Area',
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
      title={isEditMode ? 'Edit Project' : 'Create New Project'}
      description={isEditMode ? 'Update Project details' : 'Add a new Project to organize your Tasks'}
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
            label="Project Name"
            icon={FolderOpen}
            placeholder="Enter your project name"
            delay={0.1}
          />

          <DialogFieldGrid columns={2}>
            <ProjectAreaField control={form.control} />
            <IconField control={form.control} label="Project Icon" fieldName="folderIcon" delay={0.25} />
          </DialogFieldGrid>

          {isEditMode && <ProjectStatusField control={form.control} />}

          <DueDateField control={form.control} delay={0.3} />
          <CheckboxField
            control={form.control}
            label="Mark as favorite"
            description="This project will appear in your favorites"
            icon={Star}
            fieldName="isFavorite"
            delay={0.4}
          />
        </div>
      </Form>
    </FormDialog>
  );
};
