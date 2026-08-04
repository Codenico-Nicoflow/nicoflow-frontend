import { type IBucket, type ProcessingResult, type TaskEnergy, type TaskPriority, type TiptapDoc } from '@/lib/types';

export interface CreateBucketDto {
  content: string;
}

export interface UpdateBucketDto {
  content?: string;
}

// Only title is required; an omitted field means "use the task service default".
export interface TaskDetails {
  title: string;
  notes?: string;
  priority?: TaskPriority;
  energy?: TaskEnergy;
  rollsOver?: boolean;
  scheduledFor?: string; // soft intention — ISO date "YYYY-MM-DD"
  estimatedMinutes?: number;
  url?: string;
}

// Only title is required; an omitted `content` means "use the note service
// default" (the empty doc), which is why it is optional rather than nullable.
export interface NoteDetails {
  title: string;
  content?: TiptapDoc;
}

export interface ProcessBucketDto {
  processingResult: ProcessingResult;
  projectId?: string;
  taskDetails?: TaskDetails;
  noteDetails?: NoteDetails;
}

export type BucketResponse = IBucket;
// The list endpoint wraps items like the other list endpoints: { data: { items: [...] } }.
export type BucketsResponse = { items: IBucket[] };
