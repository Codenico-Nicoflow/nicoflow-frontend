// ============================================
// USER CONSTANTS
// ============================================

import type { ProcessingOption } from './interfaces';

export const USER_STATUS = {
  PREMIUM: 'premium',
  REGULAR: 'regular',
} as const;

export const GENERAL_AREA = 'general';

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
  INBOX: 'inbox',
  ACTIVE: 'active',
  DONE: 'done',
  CANCELLED: 'cancelled',
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
  TITLE: 'title',
  CREATED_AT: 'createdAt',
} as const;

export const FilterBy = {
  ALL: 'all',
  INBOX: 'inbox',
  ACTIVE: 'active',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;

export const ScheduledFor = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  THIS_WEEK: 'this_week',
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
  { value: ProcessingResult.NOTE, label: 'Note', enabled: false },
  { value: ProcessingResult.TRASH, label: 'Trash', enabled: true },
] as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];
export type TaskSortOrder = (typeof TaskSortOrder)[keyof typeof TaskSortOrder];
export type ProcessingResult = (typeof ProcessingResult)[keyof typeof ProcessingResult];
export type ScheduledFor = (typeof ScheduledFor)[keyof typeof ScheduledFor];

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
