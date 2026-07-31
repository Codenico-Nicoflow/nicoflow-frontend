import type { IRecurrenceRule, IRecurrenceStats, RecurrenceFreq } from '@/lib/types';

// The schedule half of a rule, shared by create and update. Kept separate from
// the template half so RecurrenceField can own exactly this shape.
export type RecurrenceSchedule = {
  freq: RecurrenceFreq;
  interval: number;
  byWeekday: number[];
  byMonthday?: number | null;
  startDate: string;
  endDate?: string | null;
  // "HH:MM" or null for all-day. Pro-only to SET — the server's 403 becomes the
  // dialog's upgrade prompt; clearing is open on every plan.
  scheduledTime?: string | null;
};

// POST /projects/:projectId/recurrence-rules — creates the rule and materializes
// instance #1 server-side, in the same transaction.
export type CreateRecurrenceRuleRequest = RecurrenceSchedule & {
  projectId: string;
  title: string;
  notes?: string | null;
  priority?: string;
  energy?: string;
  estimatedMinutes?: number | null;
};

// PATCH /recurrence-rules/:id — every field optional. `endDate: null` explicitly
// clears the end condition (reviving an exhausted series), which is why it is
// nullable rather than merely absent.
export type UpdateRecurrenceRuleRequest = Partial<Omit<RecurrenceSchedule, 'byWeekday'>> & {
  id: string;
  title?: string;
  notes?: string | null;
  priority?: string;
  energy?: string;
  estimatedMinutes?: number | null;
  byWeekday?: number[];
};

export type ListRecurrenceRulesRequest = {
  projectId?: string;
};

export type ListRecurrenceRulesResponse = {
  items: IRecurrenceRule[];
};

export type PauseRecurrenceRuleRequest = {
  id: string;
  paused: boolean;
};

export type RecurrenceStatsResponse = IRecurrenceStats;
