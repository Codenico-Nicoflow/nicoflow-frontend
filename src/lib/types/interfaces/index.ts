// ============================================
// IMPORTS
// ============================================

import type { ProcessingResult, TaskEnergy, TaskPriority, TaskStatus } from '../constants';
import type { IconId } from '../icons';

// ============================================
// INTERFACES
// ============================================

export type ApiErrorBody = {
  code: string;
  message: string;
};

export type ApiEnvelope<T> = {
  data: T;
  error: ApiErrorBody | null;
};

export interface IArea {
  id: string;
  name: string;
  color: string;
  icon?: IconId;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
  projects?: IProject[];
}

export interface IProject {
  id: string;
  name: string;
  areaId: string | null;
  status: 'active' | 'archived' | 'completed';
  folderIcon: string;
  dueDate?: string | null;
  isFavorite?: boolean;
  description?: string | null;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ITask {
  id: string;
  projectId: string;
  title: string;
  notes?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  energy: TaskEnergy;
  rollsOver: boolean;
  scheduledFor?: string | null; // soft intention — ISO date "YYYY-MM-DD"
  estimatedMinutes?: number | null;
  url?: string | null;
  displayOrder: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ISubtask {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  theme: 'light' | 'dark';
  language: 'en' | 'he' | 'ru';
  imageUrl: string;
  username: string;
  status: 'premium' | 'regular';
}

export interface IBucket {
  id: string;
  userId: string;
  content: string;
  processedAt?: string | null;
  processingResult?: ProcessingResult | null;
  createdTaskId?: string | null;
  createdNoteId?: string | null;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingOption {
  value: ProcessingResult;
  label: string;
  enabled: boolean;
}

export const ActiveTab = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  WEEK: 'week',
} as const;
