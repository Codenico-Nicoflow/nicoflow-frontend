import { useEffect, useState } from 'react';

import { BUCKET_PROCESSING_OPTIONS, type IBucket, ProcessingResult } from '@nicoflow/shared/types';
import { AlertCircle, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import type { RecurrenceValue } from '@/components';
import { FormDialog } from '@/components';
import { Alert, AlertDescription } from '@/components/ui/alert.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TaskDialog } from '@/features/Tasks';
import type { ProcessBucketDto, TaskDetails } from '@/lib/store';
import { invalidateApiTags, noteApi, taskApi, useGetProjectsQuery, useProcessBucketMutation } from '@/lib/store';
import { showSuccessToast, type TaskFormData, ToastMessages } from '@/lib/utils';

import { canProcessBucket, handleBucketProcess, parseBucketContent } from '../../utils';
import { captureToDoc, NOTE_TITLE_MAX, truncateNoteTitle } from '../../utils/noteDraft';
import { BucketProcessList } from '../BucketProcessList';
import { BucketProjectSelector } from '../BucketProjectSelector';

interface BucketProcessDialogProps {
  bucket: IBucket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BucketProcessDialog = ({ bucket, open, onOpenChange }: BucketProcessDialogProps) => {
  const { t } = useTranslation(['bucket', 'task']);
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery();
  const projects = projectsData?.items ?? [];
  const [processBucket, { isLoading }] = useProcessBucketMutation();
  const dispatch = useDispatch();
  const [selectedType, setSelectedType] = useState<ProcessingResult>(ProcessingResult.TASK);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  // The Task path delegates to TaskDialog for full field parity (recurrence,
  // scheduledTime, attachments). Picking "Task" opens it in place of this dialog.
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  useEffect(() => {
    if (bucket && open) {
      setNoteTitle(truncateNoteTitle(bucket.content));
      setNoteBody(bucket.content);

      if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0]?.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, open, projectsData, selectedProjectId]);

  useEffect(() => {
    if (!open) {
      setTaskDialogOpen(false);
    }
  }, [open]);

  const onSubmit = async (data?: TaskFormData) => {
    if (!bucket) return;

    if (selectedType === ProcessingResult.TASK) {
      setTaskDialogOpen(true);
      return;
    }

    // handleBucketProcess owns the success/error toasts — don't toast again here.
    try {
      await handleBucketProcess({
        bucketId: bucket.id,
        selectedType,
        selectedProjectId,
        taskData: data,
        noteData:
          selectedType === ProcessingResult.NOTE
            ? { title: truncateNoteTitle(noteTitle), content: captureToDoc(noteBody) }
            : undefined,
        processBucketMutation: args => processBucket(args).unwrap(),
        onSuccess: () => {
          onOpenChange(false);
          // The processed item leaves the inbox and, for a note, the project's
          // notes list gains a row — both caches have to move.
          invalidateApiTags(dispatch, taskApi, ['Task']);
          if (selectedType === ProcessingResult.NOTE) {
            invalidateApiTags(dispatch, noteApi, ['Note']);
          }
        },
      });
    } catch {
      // error already surfaced by handleBucketProcess
    }
  };

  const handleSubmit = () => {
    void onSubmit();
  };

  // Bucket-processing creates the task and marks the item processed in one
  // atomic backend call (POST /bucket/:id/process) — there is no endpoint to
  // link an already-created task back to an inbox item. So this can't call
  // useCreateTaskMutation like TaskDialog normally does; it must go through
  // useProcessBucketMutation directly via the onCreateSubmit override.
  // Errors are rethrown, not toasted here — TaskDialog's own catch turns
  // PLAN_LIMIT_EXCEEDED into its inline alert and everything else into a
  // toast; toasting here too would double them up.
  //
  // Returns { taskId } so TaskDialog can upload any staged attachments to the
  // newly created task (IBucket.createdTaskId carries the id).
  const handleTaskCreateSubmit = async (
    data: TaskFormData,
    projectId: string,
    recurrence: RecurrenceValue | null
  ): Promise<{ taskId: string } | void> => {
    if (!bucket) return;

    const taskDetails: TaskDetails = {
      title: data.title,
      notes: data.notes || undefined,
      priority: data.priority,
      energy: data.energy,
      rollsOver: data.rollsOver,
      scheduledFor: data.scheduledFor || undefined,
      scheduledTime: data.scheduledTime || undefined,
      estimatedMinutes: data.estimatedMinutes || undefined,
      url: data.url || undefined,
    };

    if (recurrence) {
      taskDetails.recurrence = {
        freq: recurrence.freq,
        interval: recurrence.interval,
        byWeekday: recurrence.byWeekday,
        byMonthday: recurrence.byMonthday ?? undefined,
        startDate: recurrence.startDate,
        endDate: recurrence.endDate ?? undefined,
      };
    }

    const dto: ProcessBucketDto = {
      processingResult: ProcessingResult.TASK,
      projectId,
      taskDetails,
    };

    const created = await processBucket({
      id: bucket.id,
      data: dto,
    }).unwrap();

    showSuccessToast(ToastMessages.BUCKET_PROCESSED_TASK, toast);
    invalidateApiTags(dispatch, taskApi, ['Task']);
    setTaskDialogOpen(false);
    onOpenChange(false);

    if (created.createdTaskId) {
      return { taskId: created.createdTaskId };
    }
  };

  const canSubmit = canProcessBucket(selectedType, selectedProjectId, projects.length > 0);

  if (taskDialogOpen) {
    const { title, notes } = parseBucketContent(bucket?.content ?? '');
    return (
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={openState => {
          setTaskDialogOpen(openState);
          if (!openState) onOpenChange(false);
        }}
        // A task title caps at 255 like a note title; capture allows 500, so a
        // pathological single-line capture needs the same truncation NOTE gets.
        initialTitle={truncateNoteTitle(title)}
        initialNotes={notes}
        onCreateSubmit={handleTaskCreateSubmit}
      />
    );
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('bucket:processDialog.title')}
      description={t('bucket:processDialog.description')}
      icon={CheckSquare}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      hasChanges={canSubmit}
      maxWidth="lg"
    >
      <div className="rounded-lg bg-muted/50 p-3 border">
        <p className="text-xs text-muted-foreground mb-1.5">{t('bucket:processDialog.originalContent')}</p>
        <p className="text-sm whitespace-pre-wrap break-words">{bucket?.content}</p>
      </div>

      <BucketProcessList
        processingOptions={BUCKET_PROCESSING_OPTIONS}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />

      {selectedType === ProcessingResult.TASK && !projects.length && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('bucket:processDialog.noProjects')}</AlertDescription>
        </Alert>
      )}

      {selectedType === ProcessingResult.TRASH && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('bucket:processDialog.trashAlert')}</AlertDescription>
        </Alert>
      )}

      {selectedType === ProcessingResult.NOTE &&
        (!projects.length ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('bucket:processDialog.noProjects')}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <BucketProjectSelector
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              projects={projects}
              isLoading={isLoadingProjects}
            />

            <div className="space-y-1.5">
              <Label htmlFor="process-note-title">{t('bucket:processDialog.noteTitleLabel')}</Label>
              <Input
                id="process-note-title"
                value={noteTitle}
                maxLength={NOTE_TITLE_MAX}
                placeholder={t('bucket:processDialog.noteTitlePlaceholder')}
                onChange={event => setNoteTitle(event.target.value)}
                data-testid="process-note-title"
              />
              <p className="text-muted-foreground text-xs">
                {t('bucket:processDialog.noteTitleHint', { max: NOTE_TITLE_MAX })}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="process-note-body">{t('bucket:processDialog.noteBodyLabel')}</Label>
              <Textarea
                id="process-note-body"
                value={noteBody}
                rows={5}
                placeholder={t('bucket:processDialog.noteBodyPlaceholder')}
                onChange={event => setNoteBody(event.target.value)}
                data-testid="process-note-body"
              />
            </div>
          </div>
        ))}
    </FormDialog>
  );
};
