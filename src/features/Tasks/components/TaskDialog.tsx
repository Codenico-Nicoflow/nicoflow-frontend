import { useEffect, useMemo, useRef, useState } from 'react';

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
  ConfirmDialog,
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
  useConvertTaskToRecurringMutation,
  useCreateRecurrenceRuleMutation,
  useCreateTaskMutation,
  useDeleteRecurrenceRuleMutation,
  useGetProjectsQuery,
  useGetRecurrenceRuleQuery,
  useGetUploadUrlMutation,
  useUpdateRecurrenceRuleMutation,
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
import { type EditScope, EditScopeDialog } from './EditScopeDialog';
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
   *
   * Returns `{ taskId }` so this dialog can upload any staged attachments after
   * the caller's endpoint succeeds. Returning `void` (or a bucket item with no
   * `createdTaskId`) is safe — staged files are skipped, not lost.
   *
   * The third param carries the active recurrence value so the caller can send
   * it to an endpoint that handles recurrence natively (e.g. bucket-process),
   * rather than falling back to a separate `createRule` call that this dialog
   * cannot make when `onCreateSubmit` is set.
   */
  onCreateSubmit?: (
    data: TaskFormData,
    projectId: string,
    recurrence: RecurrenceValue | null
  ) => Promise<{ taskId: string } | void>;
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
  const { t: tRec } = useTranslation('recurrence');
  const isEditMode = !!task;
  const needsProjectPicker = !isEditMode && !projectId;
  // Edit mode always shows the picker too — reassignment is a switch between
  // existing projects, never an "unassign" (a task always belongs to a project).
  const showProjectPicker = needsProjectPicker || isEditMode;

  const [createTask, { isLoading: isCreateLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdateLoading }] = useUpdateTaskMutation();
  const [createRule, { isLoading: isCreateRuleLoading }] = useCreateRecurrenceRuleMutation();
  const [convertTask, { isLoading: isConvertLoading }] = useConvertTaskToRecurringMutation();
  const [updateRule, { isLoading: isUpdateRuleLoading }] = useUpdateRecurrenceRuleMutation();
  const [deleteRule, { isLoading: isDeleteRuleLoading }] = useDeleteRecurrenceRuleMutation();
  const isRuleLoading = isCreateRuleLoading || isConvertLoading || isUpdateRuleLoading || isDeleteRuleLoading;
  // The task's own rule, if it has one — loaded so edit mode can show the real
  // schedule instead of always opening with "not repeating".
  const existingRuleId = task?.recurrenceRuleId ?? undefined;
  const { data: existingRule, isFetching: isLoadingRule } = useGetRecurrenceRuleQuery(existingRuleId as string, {
    skip: !existingRuleId,
  });
  const [getUploadUrl] = useGetUploadUrlMutation();
  const [confirmAttachment] = useConfirmAttachmentMutation();
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery(undefined, {
    skip: !showProjectPicker,
  });
  const projects = useMemo(() => projectsData?.items ?? [], [projectsData]);
  const [pickedProjectId, setPickedProjectId] = useState<string | undefined>(undefined);
  const { guardComplete, confirmDialog } = useConfirmComplete();

  // Which limit the server refused. A timed-scheduling 403 gets copy naming the
  // time, because the generic "plan limit" reads as "too many tasks" and sends
  // the user hunting for the wrong thing to delete.
  const [planLimitHit, setPlanLimitHit] = useState<'generic' | 'timedScheduling' | null>(null);
  // null = not repeating. In edit mode this is seeded from the task's own rule
  // (see the effect below) so the field reflects reality instead of always
  // opening closed. Whether saving this creates a new rule or updates the
  // existing one is decided at submit time by whether `existingRuleId` is set.
  const [recurrence, setRecurrence] = useState<RecurrenceValue | null>(null);
  // Whether the user actually touched the recurrence field this session — as
  // opposed to it merely being pre-filled from the task's existing rule.
  // hasChanges and the submit branch both need this: loading an existing rule
  // into the field must not itself count as a change or trigger a rule write.
  const [recurrenceDirty, setRecurrenceDirty] = useState(false);
  const [projectMissing, setProjectMissing] = useState(false);
  // Create-mode only: files staged locally before the task exists. Uploaded
  // for real right after a successful createTask, then dropped — never used
  // once in edit mode, where AttachmentSection owns the real ownerId.
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  // EditScopeDialog: open when editing a task that already has a rule and any
  // field changed (not just recurrence fields). Holds pending form data so the
  // scope dialog can carry it through.
  const [editScopeOpen, setEditScopeOpen] = useState(false);
  const pendingSubmitDataRef = useRef<TaskFormData | null>(null);

  // EndSeries confirm: when user toggles recurrence OFF on a task that has a rule.
  const [endSeriesConfirmOpen, setEndSeriesConfirmOpen] = useState(false);

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

  // Recurrence owns the time-of-day once it's on (stamped onto every
  // occurrence) — clear the task-level one so it can't ride along stale into
  // an update payload that also isn't sent while a rule mutation is in play.
  useEffect(() => {
    if (recurrence && form.getValues('scheduledTime')) {
      form.setValue('scheduledTime', null, { shouldDirty: true });
    }
  }, [recurrence, form]);

  useEffect(() => {
    setPlanLimitHit(null);
    setRecurrence(null);
    setRecurrenceDirty(false);
    setPickedProjectId(task ? task.projectId : undefined);
    setProjectMissing(false);
    setStagedFiles([]);
    setEditScopeOpen(false);
    setEndSeriesConfirmOpen(false);
    pendingSubmitDataRef.current = null;
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

  // Seed the field from the task's own rule once it loads. Guarded by
  // recurrenceDirty so a background refetch (WS invalidation, refocus) never
  // clobbers an edit the user is mid-way through making.
  //
  // `open` is a dependency on purpose, even though nothing in the body reads
  // it: the OTHER reset effect above (keyed on `task`/`open`) always wins the
  // race and blanks `recurrence` to null right as the dialog opens/closes —
  // but if `existingRule`/`existingRuleId`/`recurrenceDirty` all happen to
  // hold the exact same values as they did the last time this dialog was open
  // (the common case: same task, cache already warm, user never touched the
  // toggle), none of THIS effect's own deps change on reopen, so it never
  // re-runs and the reset's `null` is never overwritten. Cancel a recurring
  // task's edit dialog, reopen it, and the toggle shows off despite the task
  // still being recurring. Depending on `open` forces a reseed on every open.
  useEffect(() => {
    if (!open || !isEditMode || recurrenceDirty) return;
    if (!existingRuleId) {
      // No rule on this task — never seed from existingRule here even if the
      // query briefly still holds a previous task's cached rule mid-transition
      // (this dialog instance is reused across different tasks as `task`
      // changes, and the skipped query's `data` can lag one render behind its
      // own `skip` flag flipping true).
      setRecurrence(null);
      return;
    }
    // Guards against the same staleness in the other direction: only accept
    // existingRule once it's actually the rule for THIS task's existingRuleId.
    if (existingRule && existingRule.id === existingRuleId) {
      setRecurrence({
        freq: existingRule.freq,
        interval: existingRule.interval,
        byWeekday: existingRule.byWeekday,
        byMonthday: existingRule.byMonthday ?? null,
        startDate: existingRule.startDate,
        endDate: existingRule.endDate ?? null,
        scheduledTime: existingRule.scheduledTime ?? null,
      });
    }
  }, [open, isEditMode, existingRule, existingRuleId, recurrenceDirty]);

  // Project-less create (bucket-process delegation) had no picker before this
  // dialog took over the field — it auto-selected the user's first project so
  // processing was a single click. Preserve that default here.
  useEffect(() => {
    if (needsProjectPicker && !pickedProjectId && projects.length > 0) {
      setPickedProjectId(projects[0]?.id);
    }
  }, [needsProjectPicker, pickedProjectId, projects]);

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
    recurrenceDirty ||
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

  // Executes the actual update after a scope has been chosen (occurrence | series).
  const applyEdit = async (data: TaskFormData, scope: EditScope | null) => {
    setPlanLimitHit(null);

    try {
      if (scope === 'series' && existingRuleId && recurrence) {
        // Series edit: update the rule template (also re-stamps the live instance).
        await updateRule({
          id: existingRuleId,
          title: data.title,
          priority: data.priority,
          energy: data.energy,
          notes: data.notes ?? undefined,
          estimatedMinutes: data.estimatedMinutes ?? undefined,
          ...normalizeScheduleForFreq(recurrence),
        }).unwrap();
      } else {
        // Occurrence edit (or no-recurrence task): plain per-instance PATCH.
        const updatePayload: Parameters<ReturnType<typeof useUpdateTaskMutation>[0]>[0] = {
          id: task!.id,
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
        // scheduledFor stays editable per-instance even on a recurring task
        // (editing an instance never propagates back to the rule — SPEC §3).
        // scheduledTime does not: ScheduledTimeField is hidden while
        // recurrence is on, so its form value is always null/stale here.
        // Without this guard, saving ANY other field on a recurring task
        // (title, priority, status…) would silently wipe the time the rule
        // stamped onto this occurrence, since this branch only fires when
        // recurrenceDirty is false — i.e. nothing about recurrence changed,
        // so the existing time must survive untouched.
        if (existingRuleId) {
          delete updatePayload.scheduledTime;
        }
        await updateTask(updatePayload).unwrap();
      }
      showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
        const submittedTime = data.scheduledTime || recurrence?.scheduledTime;
        setPlanLimitHit(submittedTime ? 'timedScheduling' : 'generic');
        return;
      }
      showErrorToast(error, toast);
    }
  };

  const handleEditScopeChosen = async (scope: EditScope) => {
    setEditScopeOpen(false);
    const data = pendingSubmitDataRef.current;
    if (!data) return;
    await applyEdit(data, scope);
  };

  const handleEndSeriesConfirm = async () => {
    if (!existingRuleId) return;
    try {
      await deleteRule(existingRuleId).unwrap();
      toast.success(tRec('toast.seriesEnded'));
      setEndSeriesConfirmOpen(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const submit = async (data: TaskFormData) => {
    setPlanLimitHit(null);
    const effectiveProjectId = projectId ?? pickedProjectId;
    if (!isEditMode && !effectiveProjectId) {
      setProjectMissing(true);
      return;
    }

    // --- Edit-mode branching ---
    if (isEditMode) {
      // Case: toggle recurrence OFF on an existing rule → end the series.
      if (recurrenceDirty && !recurrence && existingRuleId) {
        setEndSeriesConfirmOpen(true);
        return;
      }

      // Case: convert plain task to recurring → direct convert, no scope choice.
      if (recurrenceDirty && recurrence && !existingRuleId) {
        try {
          await convertTask({
            taskId: task!.id,
            title: data.title,
            priority: data.priority,
            energy: data.energy,
            notes: data.notes ?? undefined,
            estimatedMinutes: data.estimatedMinutes ?? undefined,
            ...normalizeScheduleForFreq(recurrence),
          }).unwrap();
          showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
          onOpenChange(false);
          onSuccess?.();
        } catch (error) {
          if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
            const submittedTime = data.scheduledTime || recurrence?.scheduledTime;
            setPlanLimitHit(submittedTime ? 'timedScheduling' : 'generic');
            return;
          }
          showErrorToast(error, toast);
        }
        return;
      }

      // Case: recurring task, any field changed → ask occurrence vs series.
      if (existingRuleId && hasChanges) {
        pendingSubmitDataRef.current = data;
        setEditScopeOpen(true);
        return;
      }

      // Case: non-recurring task with no recurrence change.
      await applyEdit(data, null);
      return;
    }

    // --- Create-mode branching ---
    try {
      if (onCreateSubmit) {
        const result = await onCreateSubmit(data, effectiveProjectId as string, recurrence);
        if (result?.taskId && stagedFiles.length > 0) {
          void uploadStagedFiles(result.taskId, stagedFiles);
        }
      } else if (recurrence) {
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
        if (stagedFiles.length > 0) {
          void uploadStagedFiles(created.id, stagedFiles);
        }
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
        const submittedTime = data.scheduledTime || recurrence?.scheduledTime;
        setPlanLimitHit(submittedTime ? 'timedScheduling' : 'generic');
        return;
      }
      showErrorToast(error, toast);
    }
  };

  return (
    <>
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

            {/* Status is only settable on existing tasks — new tasks default to active server-side. */}
            {isEditMode && <StatusField control={form.control} delay={0.18} />}

            <DialogFieldGrid columns={2}>
              <PriorityField control={form.control} delay={0.2} />
              <EnergyField control={form.control} delay={0.22} />
            </DialogFieldGrid>

            {/* Scheduling: soft date intention + optional time-of-day (Pro-only).
                rollsOver (default on) carries a missed task to Today. The
                time-of-day input is hidden while recurrence is on — the rule's
                own scheduledTime is the one that's stamped on every occurrence,
                and showing both invited setting one and submitting the other. */}
            <div className="space-y-3 rounded-lg border border-border/60 p-3" data-testid="scheduling-block">
              <p className="text-sm font-semibold text-foreground">{t('dialog.schedulingTitle')}</p>
              <ScheduledForField control={form.control} delay={0.27} />
              {!recurrence && <ScheduledTimeField control={form.control} delay={0.28} disabled={!hasScheduledDate} />}
              <CheckboxField
                control={form.control}
                fieldName="rollsOver"
                icon={Repeat}
                label={t('dialog.rollsOverLabel')}
                description={t('dialog.rollsOverDescription')}
                delay={0.29}
              />
            </div>

            {/* Editing an already-repeating task loads its real rule (see the
                effect above) rather than always opening closed. Turning it off
                triggers the end-series confirm; turning it on for a plain task
                starts a new one — see the submit branches for which mutation fires. */}
            <RecurrenceField
              value={recurrence}
              onChange={next => {
                setRecurrence(next);
                setRecurrenceDirty(true);
              }}
              disabled={isRuleLoading || isLoadingRule}
            />

            <EstimatedTimeField control={form.control} optional delay={0.3} />
            <UrlField control={form.control} delay={0.35} optional />

            {isEditMode && task && <SubtaskAccordion taskId={task.id} />}
            {isEditMode && task && <AttachmentSection ownerType="task" ownerId={task.id} />}
            {!isEditMode && <StagedAttachmentPicker files={stagedFiles} onChange={setStagedFiles} />}
          </div>
        </Form>
        {confirmDialog}
      </FormDialog>

      <EditScopeDialog
        open={editScopeOpen}
        onOpenChange={open => {
          setEditScopeOpen(open);
          if (!open) pendingSubmitDataRef.current = null;
        }}
        onChoose={scope => void handleEditScopeChosen(scope)}
        isLoading={isUpdateLoading || isUpdateRuleLoading}
      />

      <ConfirmDialog
        open={endSeriesConfirmOpen}
        onOpenChange={setEndSeriesConfirmOpen}
        title={tRec('endSeries.title')}
        description={tRec('endSeries.description')}
        confirmLabel={tRec('endSeries.confirmLabel')}
        cancelLabel={tRec('endSeries.cancelLabel')}
        variant="danger"
        destructive
        isLoading={isDeleteRuleLoading}
        onConfirm={() => void handleEndSeriesConfirm()}
        data-testid="task-dialog-end-series-confirm"
      />
    </>
  );
};

export default TaskDialog;
