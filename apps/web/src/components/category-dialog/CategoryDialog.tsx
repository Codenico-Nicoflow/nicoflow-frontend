// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { useEffect, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Layers } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { categoryApi, useCreateCategoryMutation, useUpdateCategoryMutation } from '@my-monorepo/store';
import {
  createCategorySchema,
  showErrorToast,
  showSuccessToast,
  ToastMessages,
  updateCategorySchema,
} from '@my-monorepo/utils';

import { Form } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';

import CategoryIconField from './CategoryIconField';
import CategoryNameField from './CategoryNameField';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ICategory;
  onSuccess?: () => void;
}

const CategoryDialog = ({ open, onOpenChange, category, onSuccess }: CategoryDialogProps) => {
  const isEditMode = !!category;

  const [createCategory, { isLoading: isCreateLoading }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdateLoading }] = useUpdateCategoryMutation();
  const dispatch = useDispatch();

  const form = useForm<Partial<ICategory>>({
    defaultValues: {
      name: category?.name || '',
      icon: category?.icon || 'briefcase',
    },
    resolver: zodResolver(isEditMode ? updateCategorySchema : createCategorySchema),
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (category) {
      form.reset(category);
    }
  }, [category, form]);

  const hasChanges = useMemo(() => {
    if (!isEditMode || !category) return true;

    const originalData = {
      name: category.name,
      icon: category.icon,
    };

    const currentData = {
      name: watchedValues.name,
      icon: watchedValues.icon,
    };

    return Object.keys(originalData).some(
      key => originalData[key as keyof typeof originalData] !== currentData[key as keyof typeof currentData]
    );
  }, [isEditMode, category, watchedValues]);

  const onSubmit = async (data: CategoryFormData) => {
    if (isEditMode && !hasChanges) {
      onOpenChange(false);
      return;
    }

    try {
      if (isEditMode) {
        await updateCategory({ id: category?.id, ...data }).unwrap();
        dispatch(categoryApi.util.invalidateTags(['Category']));
        showSuccessToast(ToastMessages.CATEGORY_UPDATED, toast);
      } else {
        await createCategory(data).unwrap();
        dispatch(categoryApi.util.invalidateTags(['Category']));
        showSuccessToast(ToastMessages.CATEGORY_CREATED, toast);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit Category' : 'Create New Category'}
      description={isEditMode ? 'Update category details' : 'Add a new category to organize your projects'}
      icon={Layers}
      isEditMode={isEditMode}
      isLoading={isCreateLoading || isUpdateLoading}
      hasChanges={hasChanges}
      onSubmit={form.handleSubmit(onSubmit)}
      maxWidth="md"
    >
      <Form {...form}>
        <div className="space-y-4">
          <CategoryNameField control={form.control} />
          <CategoryIconField control={form.control} />
        </div>
      </Form>
    </FormDialog>
  );
};

export default CategoryDialog;
