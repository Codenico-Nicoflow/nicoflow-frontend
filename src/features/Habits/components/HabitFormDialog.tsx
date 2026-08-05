import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Repeat } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { FormDialog, PlanLimitAlert } from '@/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateHabitMutation, useUpdateHabitMutation } from '@/lib/store';
import type { IHabit } from '@/lib/types';

import { emptyHabitForm, type HabitFormData, habitSchema } from '../schema';

import { HabitScheduleField } from './HabitScheduleField';
import { HabitSubjectPicker } from './HabitSubjectPicker';

export interface HabitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present in edit mode; absent when creating. */
  habit?: IHabit;
}

const toFormData = (habit: IHabit): HabitFormData => ({
  name: habit.name,
  subject: habit.subject,
  polarity: habit.polarity,
  targetValue: habit.targetValue,
  unit: habit.unit ?? '',
  scheduleKind: habit.scheduleKind,
  byWeekday: habit.byWeekday ?? [],
  timesPerWeek: habit.timesPerWeek ?? 3,
});

// Create and edit in one dialog.
//
// The only structural difference between the two is polarity, which is ABSENT on
// edit rather than disabled. A greyed-out control invites the user to wonder
// what unlocks it; a short note explaining that changing it means a new habit
// answers the question instead.
export const HabitFormDialog = ({ open, onOpenChange, habit }: HabitFormDialogProps) => {
  const { t } = useTranslation('habits');
  const isEdit = Boolean(habit);

  const [createHabit, { isLoading: isCreating }] = useCreateHabitMutation();
  const [updateHabit, { isLoading: isUpdating }] = useUpdateHabitMutation();
  const [planLimited, setPlanLimited] = useState(false);

  const form = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: habit ? toFormData(habit) : emptyHabitForm,
  });

  // Reset on open so a dialog reopened for a different habit never shows the
  // previous one's values.
  useEffect(() => {
    if (open) {
      form.reset(habit ? toFormData(habit) : emptyHabitForm);
      setPlanLimited(false);
    }
  }, [open, habit, form]);

  const onSubmit = form.handleSubmit(async values => {
    // Only the fields the chosen schedule kind needs are sent. A byWeekday left
    // over from an earlier selection would describe a different schedule than
    // the one the user is looking at.
    const schedule =
      values.scheduleKind === 'weekdays'
        ? { scheduleKind: values.scheduleKind, byWeekday: values.byWeekday }
        : values.scheduleKind === 'weekly_quota'
          ? { scheduleKind: values.scheduleKind, timesPerWeek: values.timesPerWeek }
          : { scheduleKind: values.scheduleKind };

    const shared = {
      name: values.name,
      subject: values.subject,
      targetValue: values.targetValue,
      unit: values.unit ? values.unit : null,
      ...schedule,
    };

    try {
      if (habit) {
        await updateHabit({ id: habit.id, ...shared }).unwrap();
      } else {
        await createHabit({ ...shared, polarity: values.polarity }).unwrap();
      }
      onOpenChange(false);
    } catch (error) {
      // The plan wall is shown in place rather than as a toast: the user is
      // mid-task, and a disappearing message can't carry an upgrade action.
      const code =
        typeof error === 'object' && error !== null && 'data' in error
          ? ((error as { data?: { error?: { code?: string } } }).data?.error?.code ?? '')
          : '';

      if (code === 'PLAN_LIMIT_EXCEEDED') {
        setPlanLimited(true);
        return;
      }
      toast.error(t('form.errors.saveFailed'));
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('form.editTitle') : t('form.createTitle')}
      icon={Repeat}
      isEditMode={isEdit}
      isLoading={isCreating || isUpdating}
      onSubmit={onSubmit}
      data-testid="habit-form-dialog"
    >
      <div className="space-y-4">
        {planLimited ? <PlanLimitAlert message={t('form.errors.planLimit')} /> : null}

        <div className="space-y-1.5">
          <Label htmlFor="habit-name">{t('form.name')}</Label>
          <Input id="habit-name" data-testid="habit-name-input" {...form.register('name')} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive" data-testid="habit-name-error">
              {t(form.formState.errors.name.message as 'form.errors.nameRequired')}
            </p>
          ) : null}
        </div>

        <HabitSubjectPicker control={form.control} />

        <div className="flex gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="habit-target">{t('form.target')}</Label>
            <Input
              id="habit-target"
              type="number"
              min={0}
              className="w-24"
              data-testid="habit-target-input"
              {...form.register('targetValue', { valueAsNumber: true })}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="habit-unit">{t('form.unit')}</Label>
            <Input
              id="habit-unit"
              placeholder={t('form.unitPlaceholder')}
              data-testid="habit-unit-input"
              {...form.register('unit')}
            />
          </div>
        </div>
        {form.formState.errors.targetValue ? (
          <p className="text-sm text-destructive" data-testid="habit-target-error">
            {t(form.formState.errors.targetValue.message as 'form.errors.targetNegative')}
          </p>
        ) : null}

        <HabitScheduleField control={form.control} />

        {isEdit ? (
          <p className="text-xs text-muted-foreground" data-testid="habit-polarity-note">
            {t('form.polarityImmutable')}
          </p>
        ) : (
          <div className="space-y-1.5">
            <Label>{t('form.polarity')}</Label>
            <div className="flex gap-1 rounded-md bg-muted p-1" role="group">
              {(['build', 'quit'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={form.watch('polarity') === p}
                  onClick={() => form.setValue('polarity', p)}
                  data-testid={`habit-polarity-${p}`}
                  className={`flex-1 rounded px-2 py-1.5 text-sm transition-colors ${
                    form.watch('polarity') === p ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                  }`}
                >
                  {t(p === 'build' ? 'form.polarityBuild' : 'form.polarityQuit')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
};
