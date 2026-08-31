import { Bell, CheckCircle2, FolderCheck, Megaphone, Sparkles, Sunrise, Trophy } from 'lucide-react';

// The full notification `type` set (SPEC §3.11). Kept as data so a row, a test, and
// any future filter all read the source. Unknown types fall back to the bell, so a
// new backend type never renders blank or throws — forward-compatible by design.
//
// task_due_soon, task_overdue, day_plan_nudge, inbox_unprocessed, inbox_stale,
// task_scheduled_today, and daily_summary were retired in the notification rework
// (2026-08-31): morning_digest/evening_digest replace them, both unified across
// plans.
export const NOTIFICATION_TYPE_ICON: Record<string, typeof Bell> = {
  morning_digest: Sunrise,
  evening_digest: Bell,
  task_completed: CheckCircle2,
  project_completed: FolderCheck,
  system_announcement: Megaphone,
  inbox_zero: Sparkles,
  streak_milestone: Trophy,
};

// Resolve a type to its glyph, falling back to the bell for anything unrecognised.
export const iconForType = (type: string): typeof Bell => NOTIFICATION_TYPE_ICON[type] ?? Bell;

// ── Category taxonomy ────────────────────────────────────────────────────────
// Mirrors the authoritative implementation in nicoflow-shared/src/types/notification.ts
// and the Go backend (internal/domain/notification/types.go). All three must agree.
// When @nicoflow/shared publishes the new version, replace this with an import from
// @nicoflow/shared/types.

export const NotificationCategory = {
  REMINDER: 'reminder',
  SUMMARY: 'summary',
  CELEBRATION: 'celebration',
  SYSTEM: 'system',
} as const;

export type NotificationCategory = (typeof NotificationCategory)[keyof typeof NotificationCategory];

// Unknown types fall back to system — forward-compat with future backend types.
export const categoryForType = (type: string): NotificationCategory => {
  switch (type) {
    case 'morning_digest':
      return NotificationCategory.REMINDER;

    case 'evening_digest':
      return NotificationCategory.SUMMARY;

    case 'task_completed':
    case 'project_completed':
    case 'inbox_zero':
    case 'streak_milestone':
      return NotificationCategory.CELEBRATION;

    case 'system_announcement':
      return NotificationCategory.SYSTEM;

    default:
      return NotificationCategory.SYSTEM;
  }
};

// Visual style tokens per category.
export interface CategoryStyle {
  iconBg: string;
  iconText: string;
  accent: string;
}

export const CATEGORY_STYLE: Record<NotificationCategory, CategoryStyle> = {
  [NotificationCategory.REMINDER]: {
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
    accent: 'bg-amber-500',
  },
  [NotificationCategory.SUMMARY]: {
    iconBg: 'bg-muted',
    iconText: 'text-muted-foreground',
    accent: 'bg-primary',
  },
  [NotificationCategory.CELEBRATION]: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    accent: 'bg-emerald-500',
  },
  [NotificationCategory.SYSTEM]: {
    iconBg: 'bg-primary/10',
    iconText: 'text-primary',
    accent: 'bg-primary',
  },
};

export const styleForCategory = (category: NotificationCategory): CategoryStyle => CATEGORY_STYLE[category];
