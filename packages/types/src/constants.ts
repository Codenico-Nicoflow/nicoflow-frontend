// ============================================
// USER CONSTANTS
// ============================================

export const USER_STATUS = {
  PREMIUM: 'premium',
  REGULAR: 'regular',
} as const;

export const GENERAL_CATEGORY = 'general';

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
