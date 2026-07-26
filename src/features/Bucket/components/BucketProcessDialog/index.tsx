import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import {
  DescriptionField,
  DialogFieldGrid,
  EnergyField,
  EstimatedTimeField,
  FormDialog,
  NameField,
  PriorityField,
  UrlField,
} from '@/components';
import { Alert, AlertDescription } from '@/components/ui/alert.tsx';
import { Form } from '@/components/ui/form.tsx';
import { invalidateApiTags, taskApi, useGetProjectsQuery, useProcessBucketMutation } from '@/lib/store';
import { BUCKET_PROCESSING_OPTIONS, type IBucket, ProcessingResult } from '@/lib/types';
import { type TaskFormData, taskSchema } from '@/lib/utils';

import { canProcessBucket, getDefaultTaskFormValues, handleBucketProcess } from '../../utils';
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

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: getDefaultTaskFormValues(),
  });

  useEffect(() => {
    if (bucket && open) {
      const defaultValues = getDefaultTaskFormValues(bucket.content);
      form.reset(defaultValues);

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
        processBucketMutation: args => processBucket(args).unwrap(),
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          invalidateApiTags(dispatch, taskApi, ['Task']);
        },
      });
    } catch {
      // error already surfaced by handleBucketProcess
    }
  };

  const handleSubmit = () => {
    if (selectedType === ProcessingResult.TASK) {
      form.handleSubmit(onSubmit)();
    } else if (selectedType === ProcessingResult.TRASH) {
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

                <EstimatedTimeField control={form.control} optional delay={0.25} />

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

      {selectedType === ProcessingResult.NOTE && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('bucket:processDialog.noteAlert')}</AlertDescription>
        </Alert>
      )}
    </FormDialog>
  );
};
