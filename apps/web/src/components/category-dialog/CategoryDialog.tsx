// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { useEffect,useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { categoryApi,useCreateCategoryMutation, useUpdateCategoryMutation } from '@my-monorepo/store';
import { createCategorySchema, showErrorToast, showSuccessToast , ToastMessages,updateCategorySchema  } from '@my-monorepo/utils';
import { type IconId } from '@my-monorepo/utils';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';

import CategoryActionButtons from './CategoryActionButtons';
import CategoryHeader from './CategoryHeader';
import CategoryIconField from './CategoryIconField';
import CategoryNameField from './CategoryNameField';

interface Category {
  id: number;
  name: string;
  icon: IconId;
}

interface CategoryFormData {
  name: string;
  icon: IconId;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSuccess?: () => void;
}

const CategoryDialog = ({ open, onOpenChange, category, onSuccess }: CategoryDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!category;

  const [createCategory, { isLoading: isCreateLoading }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdateLoading }] = useUpdateCategoryMutation();
  const dispatch = useDispatch();

  const form = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      icon: category?.icon || 'briefcase',
    },
    resolver: zodResolver(isEditMode ? updateCategorySchema : createCategorySchema),
  });

  useEffect(() => {
    if (category) {
      form.reset(category);
    }
  }, [category, form]);

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        const hasChanges = checkForChanges(data);

        if (!hasChanges) {
          onOpenChange(false);
          return;
        }

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
    } finally {
      setIsLoading(false);
    }
  };

  const checkForChanges = (formData: CategoryFormData): boolean => {
    if (!category) return true;

    const originalData = {
      name: category.name,
      icon: category.icon,
    };

    const currentData = {
      name: formData.name,
      icon: formData.icon,
    };

    for (const key in currentData) {
      const originalValue = originalData[key as keyof typeof originalData];
      const currentValue = currentData[key as keyof typeof currentData];

      if (originalValue !== currentValue) return true;
    }

    return false;
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl sm:rounded-lg rounded-none">
        <DialogTitle className="sr-only">{isEditMode ? 'Edit Category' : 'Create New Category'}</DialogTitle>

        <DialogHeader className="p-4 sm:p-6 lg:p-8">
          <CategoryHeader isEditMode={isEditMode} />
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="p-4 sm:p-6 lg:p-8"
        >
          <Form {...form} key={category?.id || 'new'}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <CategoryNameField control={form.control} />
              <CategoryIconField control={form.control} />

              <CategoryActionButtons
                isLoading={isLoading || isCreateLoading || isUpdateLoading}
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

export default CategoryDialog;
