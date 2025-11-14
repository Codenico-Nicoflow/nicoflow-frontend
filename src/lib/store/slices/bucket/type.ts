import { type IBucket, type ProcessingResult, type TaskPriority } from '@/lib/types';

// ============================================
// REQUEST TYPES
// ============================================

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
  assignees?: number[];
}

export interface NoteDetails {
  title: string;
  content: string;
  type: string;
}

export interface SomedayDetails {
  title: string;
  description?: string;
  type: string;
}

export interface ProcessBucketDto {
  processingResult: ProcessingResult;
  projectId?: number;
  taskDetails?: TaskDetails;
  noteDetails?: NoteDetails;
  somedayDetails?: SomedayDetails;
}

// ============================================
// RESPONSE TYPES
// ============================================

export type BucketResponse = IBucket;
export type BucketsResponse = IBucket[];
