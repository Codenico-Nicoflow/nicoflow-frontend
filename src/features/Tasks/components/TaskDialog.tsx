import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ITask } from '@nicoflow/shared/types';
import { normalizeScheduleForFreq } from '@nicoflow/shared/utils';
import { CheckSquare, Repeat } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { RecurrenceValue } from '@/components';
import {
  CheckboxField,
  DescriptionField,
  DialogFieldGrid,
  EnergyField,
  EstimatedTimeField,
  FormDialog,
  NameField,
  PlanLimitAlert,
  PriorityField,
  RecurrenceField,
  ScheduledForField,
  ScheduledTimeField,
  StatusField,
  UrlField,
} from '@/components';
import { Form } from '@/components/ui/form';
import { BucketProjectSelector } from '@/features/Bucket/components/BucketProjectSelector';
import {
  useCreateRecurrenceRuleMutation,
  useCreateTaskMutation,
  useGetProjectsQuery,
  useUpdateTaskMutation,
} from '@/lib/store';
import type { TaskFormData } from '@/lib/utils';
import {
  getApiErrorCode,
  hasFormChanges,
  showErrorToast,
  showSuccessToast,
  taskSchema,
  ToastMessages,
} from '@/lib/utils';

import { useConfirmComplete } from '../useConfirmComplete';

import { AttachmentSection } from './AttachmentSection';
import { SubtaskAccordion } from './SubtaskAccordion';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ITask;
  /** Omit when creating from a project-less surface (e.g. Time Spread) — the dialog then shows a project picker. */
  projectId?: string;
  /** Pre-fills the scheduling block on create; ignored once a project picker replaces it with a chosen project's own default. */
  initialScheduledFor?: string;
  onSuccess?: () => void;
}

const TaskDialog = ({ open, onOpenChange, task, projectId, initialScheduledFor, onSuccess }: TaskDialogProps) => {
  const { t } = useTranslation('task');
  const isEditMode = !!task;
  const needsProjectPicker = !isEditMode && !projectId;

  const [createTask, { isLoading: isCreateLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdateLoading }] = useUpdateTaskMutation();
  const [createRule, { isLoading: isRuleLoading }] = useCreateRecurrenceRuleMutation();
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery(undefined, {
    skip: !needsProjectPicker,
  });
  const projects = projectsData?.items ?? [];
  const [pickedProjectId, setPickedProjectId] = useState<string | undefined>(undefined);
  const { guardComplete, confirmDialog } = useConfirmComplete();

  // Which limit the server refused. A timed-scheduling 403 gets copy naming the
  // time, because the generic "plan limit" reads as "too many tasks" and sends
  // the user hunting for the wrong thing to delete.
  const [planLimitHit, setPlanLimitHit] = useState<'generic' | 'timedScheduling' | null>(null);
  // null = an ordinary task/no change. Non-null always creates a NEW rule via
  // createRule, materializing instance #1 server-side — including on edit,
  // where it deliberately does not mutate any rule the task already belongs
  // to (that's still Settings' job). Saving recurrence from here just starts
  // a fresh series from this task forward.
  const [recurrence, setRecurrence] = useState<RecurrenceValue | null>(null);
  const [projectMissing, setProjectMissing] = useState(false);

  const form = useForm<TaskFormData>({
    defaultValues: {
      title: task?.title || '',
      notes: task?.notes || '',
      status: task?.status || 'active',
      priority: task?.priority || 'low',
      energy: task?.energy || 'medium',
      rollsOver: task?.rollsOver ?? true,
      scheduledFor: task?.scheduledFor ?? initialScheduledFor,
      scheduledTime: task?.scheduledTime ?? undefined,
      estimatedMinutes: task?.estimatedMinutes || undefined,
      url: task?.url || '',
    },
    resolver: zodResolver(taskSchema),
  });

  const watchedValues = form.watch();
  // A time without a day has nowhere to land (the backend 422s it), so clearing
  // the date clears the time with it and the time input stays disabled until a
  // date exists.
  const hasScheduledDate = !!watchedValues.scheduledFor;
  useEffect(() => {
    if (!hasScheduledDate && form.getValues('scheduledTime')) {
      form.setValue('scheduledTime', null, { shouldDirty: true });
    }
  }, [hasScheduledDate, form]);

  useEffect(() => {
    setPlanLimitHit(null);
    setRecurrence(null);
    setPickedProjectId(undefined);
    setProjectMissing(false);
    if (task) {
      form.reset({
        title: task.title,
        notes: task.notes || '',
        status: task.status || 'active',
        priority: task.priority || 'low',
        energy: task.energy || 'medium',
        rollsOver: task.rollsOver ?? true,
        scheduledFor: task.scheduledFor ?? undefined,
        scheduledTime: task.scheduledTime ?? undefined,
        estimatedMinutes: task.estimatedMinutes || undefined,
        url: task.url || '',
      });
    } else {
      form.reset({
        title: '',
        notes: '',
        status: 'active',
        priority: 'low',
        energy: 'medium',
        rollsOver: true,
        scheduledFor: initialScheduledFor,
        scheduledTime: undefined,
        estimatedMinutes: undefined,
        url: '',
      });
    }
  }, [task, form, open, initialScheduledFor]);

  // Only compare form-backed fields; server-only keys (id, createdAt…) would
  // otherwise always read as "changed" and leave save perpetually enabled.
  // Recurrence isn't form-backed, so it's OR'd in separately — turning it on
  // is itself the change, even if nothing else on the form moved.
  const hasChanges =
    hasFormChanges(isEditMode, task, watchedValues, [
      'title',
      'notes',
      'status',
      'priority',
      'energy',
      'rollsOver',
      'scheduledFor',
      'scheduledTime',
      'estimatedMinutes',
      'url',
    ]) || !!recurrence;

  // Saving an edit that flips status to done is the same completion the list
  // checkbox performs, so it asks the same question when subtasks are open.
  const onSubmit = (data: TaskFormData) => {
    if (isEditMode && !hasChanges) {
      onOpenChange(false);
      return;
    }
    if (isEditMode && task && data.status) {
      guardComplete(task, data.status, () => submit(data));
      return;
    }
    return submit(data);
  };

  const submit = async (data: TaskFormData) => {
    setPlanLimitHit(null);
    const effectiveProjectId = projectId ?? pickedProjectId;
    if (!isEditMode && !effectiveProjectId) {
      setProjectMissing(true);
      return;
    }

    try {
      if (isEditMode && recurrence) {
        // A repeating edit starts a NEW rule from this task forward rather than
        // mutating any rule the task already belongs to — same createRule call
        // as create-mode, just reachable from here too.
        await createRule({
          projectId: (task.projectId ?? effectiveProjectId) as string,
          title: data.title,
          priority: data.priority,
          energy: data.energy,
          notes: data.notes ?? undefined,
          estimatedMinutes: data.estimatedMinutes ?? undefined,
          ...normalizeScheduleForFreq(recurrence),
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_CREATED_SUCCESSFULLY, toast);
      } else if (isEditMode) {
        await updateTask({
          id: task.id,
          ...data,
          energy: data.energy,
          rollsOver: data.rollsOver,
          estimatedMinutes:
            data.estimatedMinutes === null || data.estimatedMinutes === undefined
              ? null
              : (data.estimatedMinutes ?? null),
          url: data.url || '',
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
      } else if (recurrence) {
        // A repeating task is created as a rule; the backend stamps instance #1
        // from this same template inside the same transaction.
        await createRule({
          projectId: effectiveProjectId as string,
          title: data.title,
          priority: data.priority,
          energy: data.energy,
          notes: data.notes ?? undefined,
          estimatedMinutes: data.estimatedMinutes ?? undefined,
          ...normalizeScheduleForFreq(recurrence),
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_CREATED_SUCCESSFULLY, toast);
      } else {
        await createTask({
          projectId: effectiveProjectId as string,
          title: data.title,
          priority: data.priority,
          energy: data.energy,
          rollsOver: data.rollsOver,
          notes: data.notes ?? undefined,
          estimatedMinutes: data.estimatedMinutes ?? undefined,
          scheduledFor: data.scheduledFor ?? undefined,
          scheduledTime: data.scheduledTime ?? undefined,
          url: data.url || '',
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_CREATED_SUCCESSFULLY, toast);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // A plan-limit 403 becomes an inline upgrade CTA, not a generic error toast.
      if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
        // Only a submitted time can have tripped the timed-scheduling gate — on
        // either the task or the recurrence rule; any other 403 on this form is a
        // task/project/rule count.
        const submittedTime = data.scheduledTime || recurrence?.scheduledTime;
        setPlanLimitHit(submittedTime ? 'timedScheduling' : 'generic');
        return;
      }
      showErrorToast(error, toast);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? t('dialog.editTitle') : t('dialog.createTitle')}
      description={isEditMode ? t('dialog.editDescription') : t('dialog.createDescription')}
      icon={CheckSquare}
      isEditMode={isEditMode}
      isLoading={isCreateLoading || isUpdateLoading || isRuleLoading}
      hasChanges={hasChanges}
      onSubmit={form.handleSubmit(onSubmit)}
      maxWidth="xl"
    >
      <Form {...form}>
        <div className="space-y-4">
          {planLimitHit && (
            <PlanLimitAlert
              message={planLimitHit === 'timedScheduling' ? t('calendar.timedSchedulingLocked') : undefined}
            />
          )}

          {needsProjectPicker && (
            <div className="space-y-1">
              <BucketProjectSelector
                selectedProjectId={pickedProjectId}
                setSelectedProjectId={id => {
                  setPickedProjectId(id);
                  setProjectMissing(false);
                }}
                projects={projects}
                isLoading={isLoadingProjects}
              />
              {projectMissing && <p className="text-sm text-destructive">{t('dialog.projectPlaceholder')}</p>}
            </div>
          )}

          <NameField
            control={form.control}
            fieldName="title"
            label={t('dialog.taskNameLabel')}
            icon={CheckSquare}
            placeholder={t('dialog.taskNamePlaceholder')}
            delay={0.1}
          />
          <DescriptionField
            control={form.control}
            fieldName="notes"
            label={t('dialog.descriptionLabel')}
            placeholder={t('dialog.descriptionPlaceholder')}
            minHeight="100px"
            optional
            delay={0.15}
          />

          {/* Status is only settable on existing tasks — new tasks default to active server-side.
              Not "optional" in the missing-value sense (it always has a value, active by default),
              so no Optional badge — same reasoning as Priority/Energy below. */}
          {isEditMode && <StatusField control={form.control} delay={0.18} />}

          <DialogFieldGrid columns={2}>
            <PriorityField control={form.control} delay={0.2} />
            <EnergyField control={form.control} delay={0.22} />
          </DialogFieldGrid>

          {/* Scheduling: a single soft intention (scheduledFor); rollsOver (default
              on) carries a passed task to Today — off, it quietly drops off. Never overdue. */}
          <div className="space-y-3 rounded-lg border border-border/60 p-3" data-testid="scheduling-block">
            <p className="text-sm font-semibold text-foreground">{t('dialog.schedulingTitle')}</p>
            <ScheduledForField control={form.control} delay={0.27} />
            <ScheduledTimeField control={form.control} delay={0.28} disabled={!hasScheduledDate} />
            <CheckboxField
              control={form.control}
              fieldName="rollsOver"
              icon={Repeat}
              label={t('dialog.rollsOverLabel')}
              description={t('dialog.rollsOverDescription')}
              delay={0.29}
            />
          </div>

          {/* Turning this on for an existing task starts a NEW series from here
              forward — it never edits the rule the task already belongs to.
              Managing/pausing an existing rule stays in Settings. */}
          <RecurrenceField value={recurrence} onChange={setRecurrence} disabled={isRuleLoading} />

          <EstimatedTimeField control={form.control} optional delay={0.3} />
          <UrlField control={form.control} delay={0.35} optional />

          {isEditMode && task && <SubtaskAccordion taskId={task.id} />}
          {isEditMode && task && <AttachmentSection ownerType="task" ownerId={task.id} />}
        </div>
      </Form>
      {confirmDialog}
    </FormDialog>
  );
};

export default TaskDialog;
