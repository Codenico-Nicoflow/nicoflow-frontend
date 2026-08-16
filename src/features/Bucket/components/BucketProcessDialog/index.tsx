import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { BUCKET_PROCESSING_OPTIONS, type IBucket, ProcessingResult } from '@nicoflow/shared/types';
import { AlertCircle, CheckSquare, Repeat } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import {
  CheckboxField,
  DescriptionField,
  DialogFieldGrid,
  EnergyField,
  EstimatedTimeField,
  FormDialog,
  NameField,
  PriorityField,
  ScheduledForField,
  UrlField,
} from '@/components';
import { Alert, AlertDescription } from '@/components/ui/alert.tsx';
import { Form } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { invalidateApiTags, noteApi, taskApi, useGetProjectsQuery, useProcessBucketMutation } from '@/lib/store';
import { type TaskFormData, taskSchema } from '@/lib/utils';

import { canProcessBucket, getDefaultTaskFormValues, handleBucketProcess } from '../../utils';
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

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: getDefaultTaskFormValues(),
  });

  useEffect(() => {
    if (bucket && open) {
      const defaultValues = getDefaultTaskFormValues(bucket.content);
      form.reset(defaultValues);

      // Title is truncated here, not at submit, so the field shows exactly what
      // will be saved: capture allows 500 chars, a note title caps at 255.
      setNoteTitle(truncateNoteTitle(bucket.content));
      setNoteBody(bucket.content);

      if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0]?.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, open, form, projectsData, selectedProjectId]);

  const onSubmit = async (data: TaskFormData) => {
    if (!bucket) return;
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
          form.reset();
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
    // Only the task path runs the task schema; note and trash carry their own
    // (or no) fields, so validating the task form would block them.
    if (selectedType === ProcessingResult.TASK) {
      form.handleSubmit(onSubmit)();
    } else {
      onSubmit(form.getValues());
    }
  };

  const canSubmit = canProcessBucket(selectedType, selectedProjectId, projects.length > 0);

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

      {selectedType === ProcessingResult.TASK && (
        <>
          {!projects.length ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('bucket:processDialog.noProjects')}</AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <div className="space-y-4">
                <BucketProjectSelector
                  selectedProjectId={selectedProjectId}
                  setSelectedProjectId={setSelectedProjectId}
                  projects={projects}
                  isLoading={isLoadingProjects}
                />

                <NameField
                  control={form.control}
                  fieldName="title"
                  label={t('bucket:processDialog.taskNameLabel')}
                  icon={CheckSquare}
                  placeholder={t('bucket:processDialog.taskNamePlaceholder')}
                  delay={0.1}
                />
                <DescriptionField
                  control={form.control}
                  fieldName="notes"
                  label={t('bucket:processDialog.descriptionLabel')}
                  placeholder={t('bucket:processDialog.descriptionPlaceholder')}
                  minHeight="100px"
                  optional
                  delay={0.15}
                />

                <DialogFieldGrid columns={2}>
                  <PriorityField control={form.control} delay={0.2} />
                  <EnergyField control={form.control} delay={0.22} />
                </DialogFieldGrid>

                {/* Mirrors TaskDialog's scheduling block minus scheduledTime, which
                    is Pro-gated and not part of the process contract. */}
                <div
                  className="space-y-3 rounded-lg border border-border/60 p-3"
                  data-testid="process-scheduling-block"
                >
                  <p className="text-sm font-semibold text-foreground">{t('task:dialog.schedulingTitle')}</p>
                  <ScheduledForField control={form.control} delay={0.24} />
                  <CheckboxField
                    control={form.control}
                    fieldName="rollsOver"
                    icon={Repeat}
                    label={t('task:dialog.rollsOverLabel')}
                    description={t('task:dialog.rollsOverDescription')}
                    delay={0.25}
                  />
                </div>

                <EstimatedTimeField control={form.control} optional delay={0.3} />

                <UrlField control={form.control} delay={0.35} optional />
              </div>
            </Form>
          )}
        </>
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
