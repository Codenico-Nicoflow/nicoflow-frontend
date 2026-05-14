import { type IBucket, type ProcessingResult, type TaskPriority } from '@/lib/types';

export interface CreateBucketDto {
  content: string;
}

export interface UpdateBucketDto {
  content?: string;
}

export interface TaskDetails {
  name: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedMinutes?: number;
  url?: string;
  sortOrder?: number;
}

export interface ProcessBucketDto {
  processingResult: ProcessingResult;
  projectId?: number;
  taskDetails?: TaskDetails;
}

export type BucketResponse = IBucket;
export type BucketsResponse = IBucket[];
