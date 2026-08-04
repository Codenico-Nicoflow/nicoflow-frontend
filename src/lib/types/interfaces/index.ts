// ============================================
// IMPORTS
// ============================================

import type { ProcessingResult, RecurrenceFreq, TaskEnergy, TaskPriority, TaskStatus } from '../constants';
import type { IconId } from '../icons';
import type { TiptapDoc } from '../tiptap';

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
  // Optional time-of-day on the scheduledFor day (E-051), "HH:MM" 24-hour on a
  // 15-minute boundary. Null = all-day. Setting one is Pro-only; clearing is
  // open on every plan.
  scheduledTime?: string | null;
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
  // SUM of closed focus segments in seconds (E-049). Enriched only on
  // GET /tasks/:id and GET /focus — always 0 on the project task-list.
  totalFocusSeconds: number;
  // Populated on every task read, list included — completing a task with
  // openSubtaskCount > 0 asks for confirmation first.
  subtaskCount: number;
  openSubtaskCount: number;
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
  /**
   * Calendar display preferences (NIC-1890). Optional so a response from an API
   * that predates them still types — the client normalises what it gets rather
   * than assuming the object is present and well-formed.
   */
  calendar?: ICalendarPrefs;
}

/** How the user wants the calendar grid drawn. Weekdays are 0=Sunday … 6=Saturday. */
export interface ICalendarPrefs {
  weekStart: number;
  workdays: number[];
  /** First hour drawn, 0–23. */
  dayStartHour: number;
  /** Last hour drawn, EXCLUSIVE, 1–24. */
  dayEndHour: number;
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
// and notes share one shape. All IDs are strings (backend uses
// application-generated string PKs); s3Key never crosses the wire.
//
// The 20-per-owner count is per owner, but the 100 MB byte budget is ONE pool
// spanning tasks and notes — which is why STORAGE_LIMIT_EXCEEDED is a distinct
// code from PLAN_LIMIT_EXCEEDED and gets its own message.
export type AttachmentOwnerType = 'task' | 'note';

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
  scheduledTime?: string | null; // "HH:MM" stamped onto every occurrence; null = all-day
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

// One focus-timer segment (E-049): a contiguous active run on a single task.
// Server-authoritative — every timestamp is stamped by the backend. endedAt is
// null while the segment is open; durationSeconds is 0 until it closes (the
// client renders the live tick from its own open-time anchor).
export interface IFocusSession {
  id: string;
  taskId: string;
  startedAt: string; // RFC3339
  endedAt: string | null;
  lastSeen: string; // RFC3339
  durationSeconds: number;
}

// Derived rule history. Never stored server-side — a counter would count
// materializations rather than completions and drift.
export interface IRecurrenceStats {
  done: number;
  missed: number;
  cancelled: number;
  streak: number;
}

// A project note, LIST shape (E-053). There is deliberately **no `content`
// field** — the list carries `excerpt` (content_text truncated to 200 chars,
// server-derived) so a project with 30 large documents doesn't ship them all.
// Never render a note body from a list response; refetch the scalar.
//
// `projectId` is nullable because deleting a project ORPHANS its notes
// (ON DELETE SET NULL) rather than destroying reference material. Create still
// requires a project — nullability only exists to survive the delete.
export interface INote {
  id: string;
  projectId: string | null;
  title: string;
  excerpt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// The SCALAR shape — GET /v1/notes/:id only. Swaps `excerpt` for the full body.
// `version` drives optimistic concurrency: send back the one you last read.
export interface INoteDetail extends Omit<INote, 'excerpt'> {
  content: TiptapDoc;
}

export const ActiveTab = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  WEEK: 'week',
} as const;
