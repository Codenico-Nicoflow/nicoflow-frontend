// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useEffect, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { FolderKanban } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import {
  categoryApi,
  useCreateProjectMutation,
  useGetCategoriesQuery,
  useUpdateProjectMutation,
} from '@my-monorepo/store';
import type { IProject } from '@my-monorepo/types';
import type { ProjectFormData } from '@my-monorepo/utils';
import { projectSchema, showErrorToast, showSuccessToast, ToastMessages } from '@my-monorepo/utils';

import { DialogFieldGrid } from '@/components/ui/dialog-field-grid';
import { Form } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';

import ProjectCategoryField from './fields/ProjectCategoryField';
import ProjectDueDateField from './fields/ProjectDueDateField';
import ProjectFavoriteField from './fields/ProjectFavoriteField';
import ProjectIconField from './fields/ProjectIconField';
import ProjectNameField from './fields/ProjectNameField';
import ProjectStatusField from './fields/ProjectStatusField';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: IProject;
  onSuccess?: () => void;
}

const ProjectDialog = ({ open, onOpenChange, project, onSuccess }: ProjectDialogProps) => {
  const isEditMode = !!project;

  const [createProject, { isLoading: isCreateLoading }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdateLoading }] = useUpdateProjectMutation();
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const dispatch = useDispatch();

  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: project?.name || '',
      categoryId: project?.categoryId || categories?.[0]?.id || undefined,
      icon: project?.icon || 'folder',
      status: project?.status || undefined,
      isFavorite: project?.isFavorite || false,
      dueDate: project?.dueDate ? new Date(project.dueDate) : undefined,
    },
    resolver: zodResolver(projectSchema),
  });

  // Watch form values for changes
  const watchedValues = form.watch();

  useEffect(() => {
    if (project) {
      form.reset({
        ...project,
        dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
      });
    }
  }, [project, form]);

  // Set default category when categories load (only for new projects)
  useEffect(() => {
    if (!project && categories && categories.length > 0 && !form.getValues('categoryId')) {
      form.setValue('categoryId', categories[0].id);
    }
  }, [categories, project, form]);

  // Check if there are changes in edit mode
  const hasChanges = useMemo(() => {
    if (!isEditMode || !project) return true; // Always allow create mode

    const originalData = {
      name: project.name,
      categoryId: project.categoryId,
      icon: project.icon,
      status: project.status,
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString() : null,
      isFavorite: project.isFavorite,
    };

    const currentData = {
      name: watchedValues.name || '',
      categoryId: watchedValues.categoryId,
      icon: watchedValues.icon || 'folder',
      status: watchedValues.status,
      dueDate: watchedValues.dueDate ? new Date(watchedValues.dueDate).toISOString() : null,
      isFavorite: watchedValues.isFavorite || false,
    };

    return Object.keys(originalData).some(key => {
      const originalValue = originalData[key as keyof typeof originalData];
      const currentValue = currentData[key as keyof typeof currentData];
      return originalValue !== currentValue;
    });
  }, [isEditMode, project, watchedValues]);

  const onSubmit = async (data: ProjectFormData) => {
    // Double safety check: prevent API call if no changes in edit mode
    if (isEditMode && !hasChanges) {
      onOpenChange(false);
      return;
    }

    try {
      if (isEditMode) {
        const updateData = {
          ...data,
          dueDate: data.dueDate || null,
        };

        await updateProject({ id: project?.id, body: updateData }).unwrap();
        dispatch(categoryApi.util.invalidateTags(['Category']));
        showSuccessToast(ToastMessages.PROJECT_UPDATED, toast);
      } else {
        const updatedData = {
          ...data,
        };
        delete updatedData.status;

        await createProject(updatedData).unwrap();
        dispatch(categoryApi.util.invalidateTags(['Category']));
        showSuccessToast(ToastMessages.PROJECT_CREATED, toast);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      showErrorToast(error, toast);
    } finally {
      form.reset();
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit Project' : 'Create New Project'}
      description={isEditMode ? 'Update project details' : 'Add a new project to organize your tasks'}
      icon={FolderKanban}
      isEditMode={isEditMode}
      isLoading={isCreateLoading || isUpdateLoading || isCategoriesLoading}
      hasChanges={hasChanges}
      onSubmit={form.handleSubmit(onSubmit)}
      maxWidth="xl"
    >
      <Form {...form}>
        <div className="space-y-4">
          <ProjectNameField control={form.control} />

          <DialogFieldGrid columns={2}>
            <ProjectCategoryField control={form.control} />
            <ProjectIconField control={form.control} />
          </DialogFieldGrid>

          {isEditMode && <ProjectStatusField control={form.control} />}

          <ProjectDueDateField control={form.control} />
          <ProjectFavoriteField control={form.control} />
        </div>
      </Form>
    </FormDialog>
  );
};

export default ProjectDialog;
