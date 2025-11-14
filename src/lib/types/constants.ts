// ============================================
// USER CONSTANTS
// ============================================

import type { ProcessingOption } from './interfaces';

export const USER_STATUS = {
  PREMIUM: 'premium',
  REGULAR: 'regular',
} as const;

export const GENERAL_CATEGORY = 'general';

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
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
} as const;

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const TaskSortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const TaskSortField = {
  DUE_DATE: 'dueDate',
  PRIORITY: 'priority',
  NAME: 'name',
  CREATED_AT: 'createdAt',
} as const;

export const FilterBy = {
  ALL: 'all',
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
} as const;

// ============================================
// RECURRENCE CONSTANTS
// ============================================

export const RecurrenceType = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
} as const;

export const RecurrenceFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const Weekday = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday',
} as const;

// ============================================
// NOTIFICATION CONSTANTS
// ============================================

export const NotificationType = {
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms',
} as const;

export const NotificationTrigger = {
  BEFORE_DUE: 'before_due',
  AFTER_DUE: 'after_due',
  SPECIFIC_TIME: 'specific_time',
} as const;

export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

// ============================================
// BUCKET CONSTANTS
// ============================================

export const ProcessingResult = {
  TASK: 'task',
  NOTE: 'note',
  SOMEDAY: 'someday',
  TRASH: 'trash',
} as const;

export const NoteType = {
  NOTE: 'note',
  REFERENCE: 'reference',
  REVIEW_MATERIAL: 'review_material',
} as const;

export const SomedayType = {
  IDEA: 'idea',
  PROJECT_IDEA: 'project_idea',
  TASK_IDEA: 'task_idea',
} as const;

export const BUCKET_PROCESSING_OPTIONS: ProcessingOption[] = [
  { value: ProcessingResult.TASK, label: 'Task', enabled: true },
  { value: ProcessingResult.NOTE, label: 'Note', enabled: false },
  { value: ProcessingResult.SOMEDAY, label: 'Someday', enabled: false },
  { value: ProcessingResult.TRASH, label: 'Trash', enabled: true },
] as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];
export type TaskSortOrder = (typeof TaskSortOrder)[keyof typeof TaskSortOrder];
export type RecurrenceType = (typeof RecurrenceType)[keyof typeof RecurrenceType];
export type RecurrenceFrequency = (typeof RecurrenceFrequency)[keyof typeof RecurrenceFrequency];
export type Weekday = (typeof Weekday)[keyof typeof Weekday];
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export type NotificationTrigger = (typeof NotificationTrigger)[keyof typeof NotificationTrigger];
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];
export type ProcessingResult = (typeof ProcessingResult)[keyof typeof ProcessingResult];
export type NoteType = (typeof NoteType)[keyof typeof NoteType];
export type SomedayType = (typeof SomedayType)[keyof typeof SomedayType];

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
