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
  useConfirmAttachmentMutation,
  useCreateRecurrenceRuleMutation,
  useCreateTaskMutation,
  useGetProjectsQuery,
  useGetUploadUrlMutation,
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
  uploadToS3,
} from '@/lib/utils';

import { useConfirmComplete } from '../useConfirmComplete';

import { AttachmentSection, StagedAttachmentPicker } from './AttachmentSection';
import { SubtaskAccordion } from './SubtaskAccordion';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ITask;
  /** Omit when creating from a project-less surface (e.g. Time Spread) — the dialog then shows a project picker. */
  projectId?: string;
  /** Pre-fills the scheduling block on create; ignored once a project picker replaces it with a chosen project's own default. */
  initialScheduledFor?: string;
  /** Pre-fills the title on create (e.g. a bucket item's captured content). Ignored in edit mode. */
  initialTitle?: string;
  /** Pre-fills notes on create (e.g. a bucket item's captured content). Ignored in edit mode. */
  initialNotes?: string;
  onSuccess?: () => void;
  /**
   * Create-mode only. When supplied, replaces the normal `useCreateTaskMutation`
   * call — the caller owns the request, success toast, and error handling.
   * Used by bucket-processing, whose endpoint atomically creates the task AND
   * marks the inbox item processed in one call; a plain createTask here would
   * either double-create the task or leave the bucket item unprocessed.
   */
  onCreateSubmit?: (data: TaskFormData, projectId: string) => Promise<void>;
}

const TaskDialog = ({
  open,
  onOpenChange,
  task,
  projectId,
  initialScheduledFor,
  initialTitle,
  initialNotes,
  onSuccess,
  onCreateSubmit,
}: TaskDialogProps) => {
  const { t } = useTranslation('task');
  const isEditMode = !!task;
  const needsProjectPicker = !isEditMode && !projectId;
  // Edit mode always shows the picker too — reassignment is a switch between
  // existing projects, never an "unassign" (a task always belongs to a project).
  const showProjectPicker = needsProjectPicker || isEditMode;

  const [createTask, { isLoading: isCreateLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdateLoading }] = useUpdateTaskMutation();
  const [createRule, { isLoading: isRuleLoading }] = useCreateRecurrenceRuleMutation();
  const [getUploadUrl] = useGetUploadUrlMutation();
  const [confirmAttachment] = useConfirmAttachmentMutation();
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery(undefined, {
    skip: !showProjectPicker,
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
  // Create-mode only: files staged locally before the task exists. Uploaded
  // for real right after a successful createTask, then dropped — never used
  // once in edit mode, where AttachmentSection owns the real ownerId.
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const form = useForm<TaskFormData>({
    defaultValues: {
      title: task?.title || initialTitle || '',
      notes: task?.notes || initialNotes || '',
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
    setPickedProjectId(task ? task.projectId : undefined);
    setProjectMissing(false);
    setStagedFiles([]);
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
        title: initialTitle || '',
        notes: initialNotes || '',
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
  }, [task, form, open, initialScheduledFor, initialTitle, initialNotes]);

  // Only compare form-backed fields; server-only keys (id, createdAt…) would
  // otherwise always read as "changed" and leave save perpetually enabled.
  // Recurrence isn't form-backed, so it's OR'd in separately — turning it on
  // is itself the change, even if nothing else on the form moved. projectId
  // isn't form-backed either (it's the picker's own state), so it's OR'd in too.
  const projectChanged = isEditMode && !!task && !!pickedProjectId && pickedProjectId !== task.projectId;
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
    ]) ||
    !!recurrence ||
    projectChanged;

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

  // Fires after the task already exists — a failure here never touches the
  // task itself, it only reports which files didn't make it across so the
  // user knows to retry from the task's edit view.
  const uploadStagedFiles = async (taskId: string, files: File[]) => {
    for (const file of files) {
      try {
        const { url, headers, s3Key } = await getUploadUrl({
          ownerType: 'task',
          ownerId: taskId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }).unwrap();
        await uploadToS3({ url, headers, file });
        await confirmAttachment({ s3Key, fileName: file.name }).unwrap();
      } catch {
        toast.error(t('attachments.uploadFailed', { name: file.name }));
      }
    }
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
        const updatePayload: Parameters<ReturnType<typeof useUpdateTaskMutation>[0]>[0] = {
          id: task.id,
          ...data,
          energy: data.energy,
          rollsOver: data.rollsOver,
          estimatedMinutes:
            data.estimatedMinutes === null || data.estimatedMinutes === undefined
              ? null
              : (data.estimatedMinutes ?? null),
          url: data.url || '',
        };
        if (projectChanged) {
          updatePayload.projectId = pickedProjectId;
        }
        await updateTask(updatePayload).unwrap();
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
      } else if (onCreateSubmit) {
        // Delegated create — the caller's endpoint does its own create (and any
        // side effect, e.g. marking a bucket item processed) and owns success
        // toasting; this dialog only closes and clears staged files.
        await onCreateSubmit(data, effectiveProjectId as string);
      } else {
        const created = await createTask({
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
        // Task creation is the success signal — staged-file upload failures
        // never block or roll it back, they just surface their own toasts.
        if (stagedFiles.length > 0) {
          void uploadStagedFiles(created.id, stagedFiles);
        }
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

          {showProjectPicker && (
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
              on) carries a passed task to Today — off, it quietly drops off. Never overdue.
              scheduledTime is omitted for a delegated create (e.g. bucket processing) —
              that contract doesn't accept it. */}
          <div className="space-y-3 rounded-lg border border-border/60 p-3" data-testid="scheduling-block">
            <p className="text-sm font-semibold text-foreground">{t('dialog.schedulingTitle')}</p>
            <ScheduledForField control={form.control} delay={0.27} />
            {!onCreateSubmit && <ScheduledTimeField control={form.control} delay={0.28} disabled={!hasScheduledDate} />}
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
              Managing/pausing an existing rule stays in Settings. Not offered on
              a delegated create — the bucket-process contract has no recurrence. */}
          {!onCreateSubmit && <RecurrenceField value={recurrence} onChange={setRecurrence} disabled={isRuleLoading} />}

          <EstimatedTimeField control={form.control} optional delay={0.3} />
          <UrlField control={form.control} delay={0.35} optional />

          {isEditMode && task && <SubtaskAccordion taskId={task.id} />}
          {isEditMode && task && <AttachmentSection ownerType="task" ownerId={task.id} />}
          {!isEditMode && !onCreateSubmit && <StagedAttachmentPicker files={stagedFiles} onChange={setStagedFiles} />}
        </div>
      </Form>
      {confirmDialog}
    </FormDialog>
  );
};

export default TaskDialog;
