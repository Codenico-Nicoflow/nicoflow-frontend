import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useAppUser, useGetProjectsQuery, useProcessBucketMutation } from '@my-monorepo/store';
import { type IBucket, ProcessingResult } from '@my-monorepo/types';
import { type TaskFormData, taskSchema } from '@my-monorepo/utils';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogFieldGrid } from '@/components/ui/dialog-field-grid';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import TaskDueDateField from '../tasks/components/fields/TaskDueDateField';
import TaskEstimatedMinutesField from '../tasks/components/fields/TaskEstimatedMinutesField';
import TaskUrlField from '../tasks/components/fields/TaskUrlField';

interface BucketProcessDialogProps {
  bucket: IBucket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const processingOptions = [
  { value: ProcessingResult.TASK, label: 'Task', enabled: true },
  { value: ProcessingResult.NOTE, label: 'Note', enabled: false },
  { value: ProcessingResult.SOMEDAY, label: 'Someday', enabled: false },
  { value: ProcessingResult.TRASH, label: 'Trash', enabled: true },
];

const BucketProcessDialog = ({ bucket, open, onOpenChange }: BucketProcessDialogProps) => {
  const user = useAppUser();
  const { data: projects = [], isLoading: isLoadingProjects } = useGetProjectsQuery();
  const [processBucket, { isLoading }] = useProcessBucketMutation();
  const [selectedType, setSelectedType] = useState<ProcessingResult>(ProcessingResult.TASK);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: '',
      description: '',
      priority: 'low',
      dueDate: null,
      estimatedMinutes: null,
      url: '',
    },
  });

  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

  // Smart split content into name and description
  useEffect(() => {
    if (bucket && open) {
      const lines = bucket.content.split('\n');
      const firstLine = lines[0].trim();
      const restLines = lines.slice(1).join('\n').trim();

      form.reset({
        name: firstLine,
        description: restLines || '',
        priority: 'low',
        dueDate: null,
        estimatedMinutes: null,
        url: '',
      });

      // Load last used project from localStorage
      const lastProjectKey = `bucket-last-project-${user?.id}`;
      const lastProjectId = localStorage.getItem(lastProjectKey);
      if (lastProjectId && projects.some(p => p.id === Number(lastProjectId))) {
        setSelectedProjectId(Number(lastProjectId));
      } else if (projects.length > 0) {
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [bucket, open, form, user, projects]);

  const hasProjects = projects.length > 0;

  const onSubmit = async (data: TaskFormData) => {
    if (!bucket) return;

    if (selectedType === ProcessingResult.TASK) {
      if (!selectedProjectId) {
        toast.error('Please select a project');
        return;
      }

      if (!hasProjects) {
        toast.error('Please create a project first');
        return;
      }

      try {
        // Save last used project
        const lastProjectKey = `bucket-last-project-${user?.id}`;
        localStorage.setItem(lastProjectKey, String(selectedProjectId));

        await processBucket({
          id: bucket.id,
          data: {
            processingResult: ProcessingResult.TASK,
            projectId: selectedProjectId,
            taskDetails: {
              name: data.name,
              description: data.description || undefined,
              priority: data.priority,
              dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
              estimatedMinutes: data.estimatedMinutes || undefined,
              url: data.url || undefined,
            },
          },
        }).unwrap();

        toast.success('Bucket item processed into task');
        onOpenChange(false);
        form.reset();
      } catch (error) {
        const errorMessage =
          error &&
          typeof error === 'object' &&
          'data' in error &&
          typeof (error as { data?: { message?: string } }).data === 'object' &&
          (error as { data?: { message?: string } }).data?.message
            ? (error as { data: { message: string } }).data.message
            : 'Failed to process bucket item';
        toast.error(errorMessage);
      }
    } else if (selectedType === ProcessingResult.TRASH) {
      try {
        await processBucket({
          id: bucket.id,
          data: {
            processingResult: ProcessingResult.TRASH,
          },
        }).unwrap();

        toast.success('Bucket item moved to trash');
        onOpenChange(false);
      } catch (error) {
        const errorMessage =
          error &&
          typeof error === 'object' &&
          'data' in error &&
          typeof (error as { data?: { message?: string } }).data === 'object' &&
          (error as { data?: { message?: string } }).data?.message
            ? (error as { data: { message: string } }).data.message
            : 'Failed to process bucket item';
        toast.error(errorMessage);
      }
    }
  };

  // Custom submit handler based on type
  const handleSubmit = () => {
    if (selectedType === ProcessingResult.TASK) {
      form.handleSubmit(onSubmit)();
    } else if (selectedType === ProcessingResult.TRASH) {
      onSubmit(form.getValues());
    }
  };

  // Calculate if we can submit
  const canSubmit = !!(
    selectedType === ProcessingResult.TRASH ||
    (selectedType === ProcessingResult.TASK && hasProjects && selectedProjectId)
  );

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
      {/* Display bucket content */}
      <div className="rounded-lg bg-muted/50 p-3 border">
        <p className="text-xs text-muted-foreground mb-1.5">Original Content:</p>
        <p className="text-sm whitespace-pre-wrap break-words">{bucket?.content}</p>
      </div>

      {/* Processing type selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Process as:</label>
        <div className="flex flex-wrap gap-2">
          {processingOptions.map(option => (
            <Button
              key={option.value}
              type="button"
              variant={selectedType === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => option.enabled && setSelectedType(option.value)}
              disabled={!option.enabled}
              className="relative"
            >
              {option.label}
              {!option.enabled && (
                <Badge variant="secondary" className="ml-2 text-[10px] px-1">
                  Soon
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Task Form */}
      {selectedType === ProcessingResult.TASK && (
        <>
          {!hasProjects ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to create at least one project before converting bucket items to tasks.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <div className="space-y-4">
                {/* Project Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project *</label>
                  <Select
                    value={selectedProjectId?.toString()}
                    onValueChange={value => setSelectedProjectId(Number(value))}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Task Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter task name" className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Task Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Add details..." className="resize-none min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFieldGrid columns={2}>
                  {/* Priority */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Due Date */}
                  <TaskDueDateField control={form.control} />
                </DialogFieldGrid>

                <TaskEstimatedMinutesField control={form.control} />
                <TaskUrlField control={form.control} />
              </div>
            </Form>
          )}
        </>
      )}

      {/* Trash confirmation */}
      {selectedType === ProcessingResult.TRASH && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>This item will be marked as trash for analytics purposes.</AlertDescription>
        </Alert>
      )}

      {/* Coming soon message for disabled options */}
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
