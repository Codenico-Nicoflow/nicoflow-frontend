// ============================================
// IMPORTS
// ============================================

import type { ProcessingResult, RecurrenceFreq, TaskEnergy, TaskPriority, TaskStatus } from './constants';
import type { IconId } from './icons';
import type { TiptapDoc } from './tiptap';

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
  // Null on an ordinary or still-live occurrence; 'missed' once the recurrence
  // engine has reaped it (nightly sweep or manual mark-missed).
  occurrenceStatus?: string | null;
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

// ── Habits (E-055) ──────────────────────────────────────────────────────────
//
// A habit is a recurring personal commitment tracked by check-in, not a task.
// Every derived number below is computed server-side: the client performs NO
// streak math, which is what stops web and mobile disagreeing about a figure
// the user is emotionally invested in.

export const HabitPolarity = {
  BUILD: 'build', // do the thing — satisfied at value >= target
  QUIT: 'quit', // don't — satisfied at value <= target (target usually 0)
} as const;
export type HabitPolarity = (typeof HabitPolarity)[keyof typeof HabitPolarity];

export const HabitScheduleKind = {
  DAILY: 'daily',
  WEEKDAYS: 'weekdays', // named days, via byWeekday
  WEEKLY_QUOTA: 'weekly_quota', // N times a week, any days
} as const;
export type HabitScheduleKind = (typeof HabitScheduleKind)[keyof typeof HabitScheduleKind];

// Which noun a streak counts in. Day habits count days, quota habits count
// weeks — the server decides, the client only prints it.
export const HabitStreakUnit = {
  DAY: 'day',
  WEEK: 'week',
} as const;
export type HabitStreakUnit = (typeof HabitStreakUnit)[keyof typeof HabitStreakUnit];

// Progress through the current period. Quota habits only; a day habit is simply
// done or not, so this is null there — never read a missing value as 0/0.
export interface IPeriodProgress {
  current: number;
  target: number;
}

export interface IHabit {
  id: string;
  name: string;
  subject: string; // cosmetic slug; unknown values render a fallback icon
  color: string;

  polarity: HabitPolarity;
  targetValue: number;
  unit: string | null;

  scheduleKind: HabitScheduleKind;
  byWeekday: number[] | null; // 0=Sunday…6=Saturday; only for `weekdays`
  timesPerWeek: number | null; // only for `weekly_quota`

  streakUnit: HabitStreakUnit;
  currentStreak: number;
  longestStreak: number;

  dueToday: boolean;
  completedToday: boolean;

  // Whether an entry EXISTS for today — not whether the period is satisfied.
  // The two diverge on a quota habit: at 1 of 3 the week is unmet
  // (completedToday false) but today is logged, and a control keyed off
  // completedToday would check in again rather than undo.
  loggedToday: boolean;

  todayValue: number;
  periodProgress: IPeriodProgress | null;

  // The heatmap window. A list read carries ~14 entries and a scalar read ~84 —
  // same field, different width, so a board card and a detail page render the
  // same component from the same shape.
  //
  // Optional because a server that predates it simply omits it: the ribbon then
  // does not render, rather than the card breaking.
  cells?: IHabitCell[];

  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// One square in the history ribbon. `scheduled` is what lets an off-schedule day
// render as a baseline rather than a gap — a Mon/Wed/Fri habit must not look
// like it failed four days a week.
export interface IHabitCell {
  date: string; // YYYY-MM-DD; a week cell carries its Monday
  scheduled: boolean;
  value: number;
  satisfied: boolean;
  progress: IPeriodProgress | null; // week cells only
}

// The SCALAR shape — GET /v1/habits/:id. Same fields as IHabit; the difference
// is how much of `cells` it carries (84 entries vs the list's 14), not the
// shape, so this is an alias rather than an extension.
export type IHabitDetail = IHabit;

// One entry in the served subject catalog. `labelKey` is an i18n key, not a
// display string: the server does not know the caller's language.
export interface IHabitSubject {
  slug: string;
  labelKey: string;
}

export const ActiveTab = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  WEEK: 'week',
} as const;
