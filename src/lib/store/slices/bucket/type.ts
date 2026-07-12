import { type IBucket, type ProcessingResult, type TaskPriority } from '@/lib/types';

export interface CreateBucketDto {
  content: string;
}

export interface UpdateBucketDto {
  content?: string;
}

export interface TaskDetails {
  title: string;
  notes?: string;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  url?: string;
}

export interface ProcessBucketDto {
  processingResult: ProcessingResult;
  projectId?: string;
  taskDetails?: TaskDetails;
}

export type BucketResponse = IBucket;
// The list endpoint wraps items like the other list endpoints: { data: { items: [...] } }.
export type BucketsResponse = { items: IBucket[] };
