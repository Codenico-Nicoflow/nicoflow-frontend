import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { categoryApi, useCreateCategoryMutation, useUpdateCategoryMutation } from '@my-monorepo/store';
import type { ICategory } from '@my-monorepo/types';
import {
  createCategorySchema,
  showErrorToast,
  showSuccessToast,
  ToastMessages,
  updateCategorySchema,
} from '@my-monorepo/utils';

import { IconField, NameField } from '@/components/fields';
import { Form } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { hasFormChanges } from '@/lib/utils';

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

  const hasChanges = hasFormChanges(isEditMode, category, watchedValues, ['name', 'icon']);

  const onSubmit = async (data: Partial<ICategory>) => {
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
          <NameField
            control={form.control}
            label="Category Name"
            icon={Tag}
            placeholder="Enter category name"
            delay={0.1}
          />
          <IconField control={form.control} label="Category Icon" delay={0.2} />
        </div>
      </Form>
    </FormDialog>
  );
};

export default CategoryDialog;
