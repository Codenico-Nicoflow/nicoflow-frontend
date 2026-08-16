// ============================================
// USER CONSTANTS
// ============================================

import type { ProcessingOption } from './interfaces';

export const USER_STATUS = {
  PREMIUM: 'premium',
  REGULAR: 'regular',
} as const;

// Free-plan limits (mirror backend SPEC §5). Pro is unlimited.
export const FREE_PLAN_AREA_LIMIT = 3;
export const FREE_PLAN_PROJECT_LIMIT = 5;

// ============================================
// PROJECT CONSTANTS
// ============================================
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

// ============================================
// TASK CONSTANTS
// ============================================

export const TaskStatus = {
  ACTIVE: 'active',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// Energy is the focus cost of a task (SPEC §3.4). Default medium.
export const TaskEnergy = {
  LOW: 'low',
  MEDIUM: 'medium',
  DEEP: 'deep',
} as const;

export const TaskSortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const TaskSortField = {
  SCHEDULED_FOR: 'scheduledFor',
  PRIORITY: 'priority',
  TITLE: 'title',
  CREATED_AT: 'createdAt',
} as const;

// Status tabs. Independent of scheduling — see ScheduleFilter.
export const FilterBy = {
  ALL: 'all',
  ACTIVE: 'active',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;

// Scheduled/unscheduled is derived from scheduledFor, never a stored status.
// This chip is only meaningful under the Active status tab.
export const ScheduleFilter = {
  ALL: 'all',
  SCHEDULED: 'scheduled',
  UNSCHEDULED: 'unscheduled',
} as const;

// ============================================
// RECURRENCE CONSTANTS (E-050)
// ============================================

// A deliberate subset of RFC 5545, stored as fields rather than an RRULE string
// so the UI can render a human summary without a parser.
export const RecurrenceFreq = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

// Weekday values match Date.getDay() / the backend's by_weekday (0 = Sunday).
export const RECURRENCE_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

// -1 selects the last day of the month, whatever its length. The only legal
// byMonthday outside 1..31.
export const MONTHDAY_LAST = -1;

// Interval bounds mirror the backend CHECK (1..366).
export const RECURRENCE_MIN_INTERVAL = 1;
export const RECURRENCE_MAX_INTERVAL = 366;

// Free plan rule cap (SPEC §5). The 4th attempt returns PLAN_LIMIT_EXCEEDED.
export const FREE_PLAN_RULE_LIMIT = 3;

// The end condition the UI offers. There is deliberately no "after N times" —
// `count` was dropped from the schema.
export const RecurrenceEnd = {
  NEVER: 'never',
  ON_DATE: 'onDate',
} as const;

// ============================================
// BUCKET CONSTANTS
// ============================================

export const ProcessingResult = {
  TASK: 'task',
  NOTE: 'note',
  TRASH: 'trash',
} as const;

export const BUCKET_PROCESSING_OPTIONS: ProcessingOption[] = [
  { value: ProcessingResult.TASK, label: 'Task', enabled: true },
  { value: ProcessingResult.NOTE, label: 'Note', enabled: true },
  { value: ProcessingResult.TRASH, label: 'Trash', enabled: true },
] as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];
export type TaskEnergy = (typeof TaskEnergy)[keyof typeof TaskEnergy];
export type TaskSortOrder = (typeof TaskSortOrder)[keyof typeof TaskSortOrder];
export type ProcessingResult = (typeof ProcessingResult)[keyof typeof ProcessingResult];
export type RecurrenceFreq = (typeof RecurrenceFreq)[keyof typeof RecurrenceFreq];
export type RecurrenceEnd = (typeof RecurrenceEnd)[keyof typeof RecurrenceEnd];

// ============================================
// AUTH CONSTANTS
// ============================================

export const AuthType = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot-password',
} as const;

export const RegisterInputs = [
  {
    label: 'Username',
    name: 'username',
    type: 'text',
    placeholder: 'Enter your username',
    required: true,
  },
  {
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    label: 'Password',
    name: 'password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true,
  },
];

export const LoginInputs = [
  {
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    label: 'Password',
    name: 'password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true,
  },
];

export const ResetPasswordInputs = [
  {
    label: 'New Password',
    name: 'newPassword',
    type: 'password',
    placeholder: 'Enter your new password',
    required: true,
  },
  {
    label: 'Confirm Password',
    name: 'confirmPassword',
    type: 'password',
    placeholder: 'Confirm your new password',
    required: true,
  },
];

export const ForgotPasswordInputs = [
  {
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'Enter your email',
    required: true,
  },
];
