// ============================================
// IMPORTS
// ============================================

import type {
  NotificationStatus,
  NotificationTrigger,
  NotificationType,
  ProcessingResult,
  RecurrenceFrequency,
  RecurrenceType,
  TaskPriority,
  TaskSortOrder,
  TaskStatus,
  Weekday,
} from '../constants';
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

export interface ITaskRecurrence {
  id: number;
  taskId: number;
  type: RecurrenceType;
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays: Weekday[];
  dayOfMonth: number;
  monthOfYear: number;
  endDate: string;
  maxOccurrences: number;
  occurrenceCount: number;
  lastGenerated: string;
  nextOccurrence: string;
  customPattern: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITaskNotification {
  id: number;
  taskId: number;
  type: NotificationType;
  trigger: NotificationTrigger;
  status: NotificationStatus;
  triggerTime: string;
  minutesBeforeDue: number;
  minutesAfterDue: number;
  message: string;
  isActive: boolean;
  lastSent: string;
  nextScheduled: string;
  retryCount: number;
  maxRetries: number;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITask {
  id: number;
  name: string;
  projectId: number;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  priority: TaskPriority;
  sortOrder?: TaskSortOrder;
  assignees?: number[];
  recurrence?: ITaskRecurrence;
  notifications?: ITaskNotification[];
  completedAt?: string;
  url?: string;
  estimatedMinutes?: number | null;
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
