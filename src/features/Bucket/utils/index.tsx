import { ProcessingResult } from '@nicoflow/shared/types';
import { toast } from 'sonner';

import type { NoteDetails, ProcessBucketDto, TaskDetails } from '@/lib/store';
import { showErrorToast, showSuccessToast, type TaskFormData, ToastMessages } from '@/lib/utils';

/**
 * Parses Bucket content into task form fields
 * First line becomes the task title, rest becomes notes
 */
export const parseBucketContent = (content: string) => {
  const lines = content.split('\n');
  const firstLine = lines[0]?.trim() || '';
  const restLines = lines.slice(1).join('\n').trim();

  return {
    title: firstLine,
    notes: restLines || '',
  };
};

/**
 * Validates if Bucket can be processed based on selected type and required data
 */
export const canProcessBucket = (
  selectedType: ProcessingResult,
  selectedProjectId: string | undefined,
  hasProjects: boolean
): boolean => {
  switch (selectedType) {
    case ProcessingResult.TASK:
      return hasProjects && !!selectedProjectId;
    case ProcessingResult.TRASH:
      return true;
    // A note needs a project for the same reason a task does — the backend
    // 422s without one, and an orphaned note isn't what the user asked for.
    case ProcessingResult.NOTE:
      return hasProjects && !!selectedProjectId;
    default:
      return false;
  }
};

// ============================================
// PROCESSING LOGIC
// ============================================

export interface ProcessBucketParams {
  bucketId: string;
  selectedType: ProcessingResult;
  selectedProjectId?: string;
  taskData?: TaskFormData;
  noteData?: NoteDetails;
}

export const buildProcessBucketDto = ({
  selectedType,
  selectedProjectId,
  taskData,
  noteData,
}: ProcessBucketParams): ProcessBucketDto => {
  const baseDto: ProcessBucketDto = {
    processingResult: selectedType,
  };

  switch (selectedType) {
    case ProcessingResult.TASK: {
      if (!taskData || !selectedProjectId) {
        throw new Error('Task data and Project ID are required for task processing');
      }

      const taskDetails: TaskDetails = {
        title: taskData.title,
        notes: taskData.notes || undefined,
        priority: taskData.priority,
        energy: taskData.energy,
        rollsOver: taskData.rollsOver,
        scheduledFor: taskData.scheduledFor || undefined,
        estimatedMinutes: taskData.estimatedMinutes || undefined,
        url: taskData.url || undefined,
      };

      return {
        ...baseDto,
        projectId: selectedProjectId,
        taskDetails,
      };
    }

    case ProcessingResult.NOTE: {
      if (!noteData || !selectedProjectId) {
        throw new Error('Note data and Project ID are required for note processing');
      }

      return {
        ...baseDto,
        projectId: selectedProjectId,
        noteDetails: noteData,
      };
    }

    case ProcessingResult.TRASH:
      return baseDto;

    default:
      throw new Error(`Unknown processing type: ${selectedType}`);
  }
};

/**
 * Handles the complete Bucket processing workflow
 */
export const handleBucketProcess = async ({
  bucketId,
  selectedType,
  selectedProjectId,
  taskData,
  noteData,
  processBucketMutation,
  onSuccess,
}: ProcessBucketParams & {
  processBucketMutation: (args: { id: string; data: ProcessBucketDto }) => Promise<unknown>;
  onSuccess: () => void;
}): Promise<void> => {
  try {
    const processDto = buildProcessBucketDto({
      bucketId,
      selectedType,
      selectedProjectId,
      taskData,
      noteData,
    });

    await processBucketMutation({
      id: bucketId,
      data: processDto,
    });

    switch (selectedType) {
      case ProcessingResult.TASK:
        showSuccessToast(ToastMessages.BUCKET_PROCESSED_TASK, toast);
        break;
      case ProcessingResult.NOTE:
        showSuccessToast(ToastMessages.BUCKET_PROCESSED_NOTE, toast);
        break;
      case ProcessingResult.TRASH:
        showSuccessToast(ToastMessages.BUCKET_PROCESSED_TRASH, toast);
        break;
    }

    onSuccess();
  } catch (error) {
    showErrorToast(error, toast);
    throw error;
  }
};

// ============================================
// DEFAULT FORM VALUES
// ============================================

/**
 * Returns default form values for task creation from Bucket
 */
export const getDefaultTaskFormValues = (bucketContent?: string): TaskFormData => {
  if (bucketContent) {
    const { title, notes } = parseBucketContent(bucketContent);
    return {
      title,
      notes,
      priority: 'low',
      energy: 'medium',
      rollsOver: true,
      scheduledFor: null,
      estimatedMinutes: null,
      url: '',
    };
  }

  return {
    title: '',
    notes: '',
    priority: 'low',
    energy: 'medium',
    rollsOver: true,
    scheduledFor: null,
    estimatedMinutes: null,
    url: '',
  };
};
