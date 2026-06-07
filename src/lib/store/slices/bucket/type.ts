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
  dueDate?: string;
  estimatedMinutes?: number;
  url?: string;
}

export interface ProcessBucketDto {
  processingResult: ProcessingResult;
  projectId?: string;
  taskDetails?: TaskDetails;
}

export type BucketResponse = IBucket;
export type BucketsResponse = IBucket[];
