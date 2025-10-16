// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';

import ProjectActionButtons from './fields/ProjectActionButtons';
import ProjectCategoryField from './fields/ProjectCategoryField';
import ProjectDueDateField from './fields/ProjectDueDateField';
import ProjectFavoriteField from './fields/ProjectFavoriteField';
import ProjectIconField from './fields/ProjectIconField';
import ProjectNameField from './fields/ProjectNameField';
import ProjectStatusField from './fields/ProjectStatusField';
import ProjectDialogHeader from './ProjectDialogHeader';

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

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (isEditMode) {
        const hasChanges = checkForChanges(data);

        if (!hasChanges) {
          onOpenChange(false);
          return;
        }

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

  const checkForChanges = (formData: ProjectFormData): boolean => {
    if (!project) return true;

    const originalData = {
      name: project.name,
      categoryId: project.categoryId,
      icon: project.icon,
      status: project.status,
      dueDate: project.dueDate,
      isFavorite: project.isFavorite,
    };

    const currentData = {
      name: formData.name,
      categoryId: formData.categoryId,
      icon: formData.icon,
      status: formData.status,
      dueDate: formData.dueDate,
      isFavorite: formData.isFavorite,
    };

    for (const key in currentData) {
      const originalValue = originalData[key as keyof typeof originalData];
      const currentValue = currentData[key as keyof typeof currentData];

      if (key === 'dueDate') {
        const originalDate = originalValue ? new Date(originalValue).toISOString() : null;
        const currentDate = currentValue ? new Date(currentValue).toISOString() : null;
        if (originalDate !== currentDate) return true;
      } else {
        if (originalValue !== currentValue) return true;
      }
    }

    return false;
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="w-[95vw] max-w-5xl sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl sm:rounded-lg rounded-none"
      >
        <DialogHeader className="p-2 sm:p-6 lg:p-4">
          <ProjectDialogHeader isEditMode={isEditMode} />
          <DialogTitle className="sr-only">{isEditMode ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="p-4 sm:p-6 lg:p-8"
        >
          <Form {...form} key={project?.id || 'new'}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <ProjectNameField control={form.control} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <ProjectCategoryField control={form.control} />
                <ProjectIconField control={form.control} />
              </div>

              {isEditMode && <ProjectStatusField control={form.control} />}

              <ProjectDueDateField control={form.control} />

              <ProjectFavoriteField control={form.control} />

              <ProjectActionButtons
                isLoading={isCreateLoading || isUpdateLoading || isCategoriesLoading}
                isEditMode={isEditMode}
                onCancel={handleCancel}
              />
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDialog;
