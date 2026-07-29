// ============================================
// IMPORTS
// ============================================

import type { ProcessingResult, RecurrenceFreq, TaskEnergy, TaskPriority, TaskStatus } from '../constants';
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
  areaId: string;
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
  // Set only on a materialized recurring occurrence (E-050); both null on an
  // ordinary task.
  recurrenceRuleId?: string | null;
  occurrenceDate?: string | null; // ISO date "YYYY-MM-DD"
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
  timezone: string;
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

export interface INotification {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface INotificationPref {
  emailDigest: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  beforeDueMinutes: number;
  afterDueMinutes: number;
  overdueEnabled: boolean;
  dailySummaryEnabled: boolean;
  inboxNudgesEnabled: boolean;
  streaksEnabled: boolean;
  morningHour: number;
  eveningHour: number;
}

export interface ProcessingOption {
  value: ProcessingResult;
  label: string;
  enabled: boolean;
}

// A stored file attachment. The owner is a polymorphic {type, id} pair so tasks
// (now) and notes (later) share one shape. All IDs are strings (backend uses
// application-generated string PKs); s3Key never crosses the wire.
export type AttachmentOwnerType = 'task';

export interface IAttachment {
  id: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

// A recurrence rule: a task template plus a schedule and a cursor (E-050). The
// tasks it produces are ordinary ITask rows carrying recurrenceRuleId. All IDs
// are strings; every date is an ISO "YYYY-MM-DD" (there is no time-of-day).
export interface IRecurrenceRule {
  id: string;
  projectId: string;
  title: string;
  notes?: string | null;
  priority: TaskPriority;
  energy: TaskEnergy;
  estimatedMinutes?: number | null;
  freq: RecurrenceFreq;
  interval: number; // 1..366
  byWeekday: number[]; // weekly only; 0=Sun..6=Sat. Always an array, never null.
  byMonthday?: number | null; // monthly only; 1..31 or -1 (last day)
  startDate: string;
  endDate?: string | null; // null = runs forever
  nextOccurrence?: string | null; // null = series exhausted
  paused: boolean;
  createdAt: string;
  updatedAt: string;
}

// Derived rule history. Never stored server-side — a counter would count
// materializations rather than completions and drift.
export interface IRecurrenceStats {
  done: number;
  missed: number;
  cancelled: number;
  streak: number;
}

export const ActiveTab = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  WEEK: 'week',
} as const;
