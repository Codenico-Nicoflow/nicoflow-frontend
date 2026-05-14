// ============================================
// IMPORTS
// ============================================

import type { ProcessingResult, TaskPriority, TaskStatus } from '../constants';
import type { IconId } from '../icons';

// ============================================
// INTERFACES
// ============================================

export interface IArea {
  id: number;
  name: string;
  icon?: IconId;
  sortOrder?: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  projects?: IProject[];
}

export interface IProject {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  area: IArea;
  areaId: number;
  status: 'active' | 'archived' | 'completed';
  icon?: IconId;
  sortOrder?: number;
  dueDate?: string;
  isFavorite?: boolean;
}

export interface ITask {
  id: number;
  name: string;
  projectId: number;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  scheduledFor?: 'today' | 'tomorrow' | 'this_week' | null;
  estimatedMinutes?: number | null;
  url?: string;
  sortOrder?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  theme: 'light' | 'dark';
  imageUrl: string;
  username: string;
  status: 'premium' | 'regular';
}

export interface IBucket {
  id: number;
  userId: number;
  content: string;
  processedAt?: string | null;
  processingResult?: ProcessingResult | null;
  createdTaskId?: number | null;
  createdNoteId?: number | null;
  projectId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingOption {
  value: ProcessingResult;
  label: string;
  enabled: boolean;
}
