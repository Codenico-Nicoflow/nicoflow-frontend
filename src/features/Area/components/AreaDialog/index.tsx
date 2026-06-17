import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { ColorField, FormDialog, IconField, NameField, PlanLimitAlert } from '@/components';
import { Form } from '@/components/ui/form.tsx';
import { areaApi, invalidateApiTags, useCreateAreaMutation, useUpdateAreaMutation } from '@/lib/store';
import type { IArea } from '@/lib/types';
import type { AreaFormData } from '@/lib/utils';
import {
  createAreaSchema,
  getApiErrorCode,
  hasFormChanges,
  showErrorToast,
  showSuccessToast,
  ToastMessages,
} from '@/lib/utils';

interface AreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area?: IArea;
  onSuccess?: () => void;
}

export const AreaDialog = ({ open, onOpenChange, area, onSuccess }: AreaDialogProps) => {
  const isEditMode = !!area;

  const [createArea, { isLoading: isCreateLoading }] = useCreateAreaMutation();
  const [updateArea, { isLoading: isUpdateLoading }] = useUpdateAreaMutation();
  const dispatch = useDispatch();
  const [planLimitHit, setPlanLimitHit] = useState(false);

  const form = useForm<AreaFormData>({
    defaultValues: {
      name: area?.name || '',
      color: area?.color || '#3B82F6',
      icon: area?.icon || 'briefcase',
    },
    resolver: zodResolver(createAreaSchema),
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (area) {
      form.reset({ name: area.name, color: area.color, icon: area.icon });
    }
  }, [area, form]);

  useEffect(() => {
    if (!open) {
      setPlanLimitHit(false);
    }
  }, [open]);

  const hasChanges = hasFormChanges(isEditMode, area, watchedValues, ['name', 'color', 'icon']);

  const onSubmit = async (data: AreaFormData) => {
    if (isEditMode && !hasChanges) {
      onOpenChange(false);
      return;
    }

    setPlanLimitHit(false);

    try {
      if (isEditMode && area) {
        await updateArea({ id: area.id, ...data }).unwrap();
        invalidateApiTags(dispatch, areaApi, ['Area'] as const);
        showSuccessToast(ToastMessages.AREA_UPDATED, toast);
      } else {
        await createArea(data).unwrap();
        invalidateApiTags(dispatch, areaApi, ['Area'] as const);
        showSuccessToast(ToastMessages.AREA_CREATED, toast);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
        setPlanLimitHit(true);
      }
      showErrorToast(error, toast);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit Area' : 'Create New Area'}
      description={isEditMode ? 'Update Area details' : 'Add a new Area to organize your projects'}
      icon={Layers}
      isEditMode={isEditMode}
      isLoading={isCreateLoading || isUpdateLoading}
      hasChanges={hasChanges}
      onSubmit={form.handleSubmit(onSubmit)}
      maxWidth="md"
    >
      <Form {...form}>
        <div className="space-y-4">
          {planLimitHit && <PlanLimitAlert />}
          <NameField control={form.control} label="Area Name" icon={Tag} placeholder="Enter area name" delay={0.1} />
          <ColorField control={form.control} label="Area Color" delay={0.15} />
          <IconField control={form.control} label="Area Icon" delay={0.2} />
        </div>
      </Form>
    </FormDialog>
  );
};
