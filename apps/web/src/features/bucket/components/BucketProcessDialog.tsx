import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { useGetProjectsQuery, useProcessBucketMutation } from '@my-monorepo/store';
import { BUCKET_PROCESSING_OPTIONS, type IBucket, ProcessingResult } from '@my-monorepo/types';
import { type TaskFormData, taskSchema } from '@my-monorepo/utils';

import {
  DescriptionField,
  DueDateField,
  EstimatedTimeField,
  NameField,
  PriorityField,
  UrlField,
} from '@/components/fields';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DialogFieldGrid } from '@/components/ui/dialog-field-grid';
import { Form } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';

import { canProcessBucket, getDefaultTaskFormValues, handleBucketProcess } from '../utils';

import BucketProcessList from './BucketProcessList';
import BucketProjectSelector from './BucketProjectSelector';

interface BucketProcessDialogProps {
  bucket: IBucket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BucketProcessDialog = ({ bucket, open, onOpenChange }: BucketProcessDialogProps) => {
  const { data: projects = [] } = useGetProjectsQuery();
  const [processBucket, { isLoading }] = useProcessBucketMutation();
  const [selectedType, setSelectedType] = useState<ProcessingResult>(ProcessingResult.TASK);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

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
  }, [bucket, open, form, projects, selectedProjectId]);

  const onSubmit = async (data: TaskFormData) => {
    if (!bucket) return;

    await handleBucketProcess({
      bucketId: bucket.id,
      selectedType,
      selectedProjectId,
      taskData: data,
      processBucketMutation: args => processBucket(args).unwrap(),
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
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
      title="Process Bucket Item"
      description="Transform this item into a task, note, or idea for later."
      icon={CheckSquare}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      hasChanges={canSubmit}
      maxWidth="lg"
    >
      <div className="rounded-lg bg-muted/50 p-3 border">
        <p className="text-xs text-muted-foreground mb-1.5">Original Content:</p>
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
              <AlertDescription>
                You need to create at least one project before converting bucket items to tasks.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <div className="space-y-4">
                <BucketProjectSelector
                  selectedProjectId={selectedProjectId}
                  setSelectedProjectId={setSelectedProjectId}
                  projects={projects}
                />

                <NameField
                  control={form.control}
                  label="Task Name"
                  icon={CheckSquare}
                  placeholder="Enter task name"
                  delay={0.1}
                />
                <DescriptionField
                  control={form.control}
                  label="Description"
                  placeholder="Add task details..."
                  minHeight="100px"
                  delay={0.15}
                  optional
                />

                <DialogFieldGrid columns={2}>
                  <PriorityField control={form.control} delay={0.2} />
                  <DueDateField control={form.control} delay={0.25} />
                </DialogFieldGrid>

                <EstimatedTimeField control={form.control} delay={0.3} />
                <UrlField control={form.control} delay={0.35} />
              </div>
            </Form>
          )}
        </>
      )}

      {selectedType === ProcessingResult.TRASH && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>This item will be marked as trash for analytics purposes.</AlertDescription>
        </Alert>
      )}

      {(selectedType === ProcessingResult.NOTE || selectedType === ProcessingResult.SOMEDAY) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>This feature is coming soon! Stay tuned.</AlertDescription>
        </Alert>
      )}
    </FormDialog>
  );
};

export default BucketProcessDialog;
