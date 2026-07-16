import {
  AlarmClock,
  Bell,
  CalendarClock,
  CheckCircle2,
  FolderCheck,
  Inbox,
  Megaphone,
  Sparkles,
  Sunrise,
  Trophy,
} from 'lucide-react';

// The full notification `type` set (SPEC §3.11). Kept as data so a row, a test, and
// any future filter all read the same source. Unknown types fall back to the bell,
// so a new backend type never renders blank or throws — forward-compatible by design.
export const NOTIFICATION_TYPE_ICON: Record<string, typeof Bell> = {
  task_due_soon: AlarmClock,
  task_overdue: CalendarClock,
  task_scheduled_today: Sunrise,
  task_completed: CheckCircle2,
  project_completed: FolderCheck,
  system_announcement: Megaphone,
  day_plan_nudge: Sunrise,
  inbox_unprocessed: Inbox,
  inbox_stale: Inbox,
  inbox_zero: Sparkles,
  daily_summary: Bell,
  streak_milestone: Trophy,
};

// Resolve a type to its glyph, falling back to the bell for anything unrecognised.
export const iconForType = (type: string): typeof Bell => NOTIFICATION_TYPE_ICON[type] ?? Bell;
