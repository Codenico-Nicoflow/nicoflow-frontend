import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { FolderKanban, FolderOpen, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { CheckboxField, DialogFieldGrid, DueDateField, FormDialog, IconField, NameField } from '@/components';
import { Form } from '@/components/ui/form';
import { categoryApi, useCreateProjectMutation, useGetCategoriesQuery, useUpdateProjectMutation } from '@/lib/store';
import type { IProject } from '@/lib/types';
import type { ProjectFormData } from '@/lib/utils';
import { hasFormChanges, projectSchema, showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

import ProjectCategoryField from './ProjectCategoryField';
import ProjectStatusField from './ProjectStatusField';

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

  const watchedValues = form.watch();

  useEffect(() => {
    if (project) {
      form.reset({
        ...project,
        dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
      });
    }
  }, [project, form]);

  useEffect(() => {
    if (!project && categories && categories.length > 0 && !form.getValues('categoryId')) {
      form.setValue('categoryId', categories[0]?.id || 0);
    }
  }, [categories, project, form]);

  const hasChanges = hasFormChanges(isEditMode, project, watchedValues as Partial<IProject>, [
    'name',
    'categoryId',
    'icon',
    'status',
    'dueDate',
    'isFavorite',
  ]);

  const onSubmit = async (data: ProjectFormData) => {
    if (isEditMode && !hasChanges) {
      onOpenChange(false);
      return;
    }

    try {
      if (isEditMode) {
        const updateData = {
          ...data,
          dueDate: data.dueDate instanceof Date ? data.dueDate.toISOString() : undefined,
        };

        await updateProject({ id: project?.id, body: updateData }).unwrap();
        dispatch(categoryApi.util.invalidateTags(['Category']));
        showSuccessToast(ToastMessages.PROJECT_UPDATED, toast);
      } else {
        const createData = {
          ...data,
          dueDate: data.dueDate instanceof Date ? data.dueDate.toISOString() : undefined,
        };

        await createProject(createData).unwrap();
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
          <NameField
            control={form.control}
            label="Project Name"
            icon={FolderOpen}
            placeholder="Enter your project name"
            delay={0.1}
          />

          <DialogFieldGrid columns={2}>
            <ProjectCategoryField control={form.control} />
            <IconField control={form.control} label="Project Icon" delay={0.25} />
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

export default ProjectDialog;
