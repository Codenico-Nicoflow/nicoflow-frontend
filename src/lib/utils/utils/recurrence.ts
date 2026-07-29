import type { IRecurrenceRule, RecurrenceFreq } from '@/lib/types';
import { MONTHDAY_LAST, RECURRENCE_MAX_INTERVAL, RECURRENCE_MIN_INTERVAL, RecurrenceFreq as Freq } from '@/lib/types';

// Pure recurrence helpers: no React, no DOM, no i18next import. Keeps this file
// import-clean for the E-033 shared-package extraction and reusable by the
// mobile SDK.

// The minimum a summary needs; accepting this rather than a whole rule lets the
// create form preview a schedule that has no id yet.
export type SummarizableRule = Pick<IRecurrenceRule, 'freq' | 'interval' | 'byWeekday' | 'byMonthday'> & {
  endDate?: string | null;
};

// Which i18n key a schedule resolves to, plus the interpolation values it needs.
// Returning a descriptor rather than a finished string keeps this pure and lets
// the caller use its own typed `t` — the project's i18next keys are literal
// types, so a helper that took a generic translate function would either break
// type-safety or be impossible to satisfy.
//
// `count` is always present: it drives plural selection, so Hebrew's `_two`
// form resolves for count === 2. Dropping it leaks English into a Hebrew string.
export type RecurrenceSummaryKey =
  | 'summary.daily'
  | 'summary.weekly'
  | 'summary.monthly'
  | 'summary.monthlyLast'
  | 'summary.yearly'
  | 'freq.weekly';

export type RecurrenceSummary = {
  key: RecurrenceSummaryKey;
  count: number;
  // Weekday indices to render as a list, in ascending order (not click order),
  // so the summary is stable. Empty unless the key is summary.weekly.
  weekdays: number[];
  // Present only for summary.monthly.
  day?: number;
  // Set when the series has an end date; the caller wraps with summary.until.
  endDate?: string | null;
};

export const summarizeRecurrence = (rule: SummarizableRule): RecurrenceSummary => {
  const count = rule.interval;
  const endDate = rule.endDate ?? null;
  const days = [...(rule.byWeekday ?? [])].sort((a, b) => a - b);

  switch (rule.freq) {
    case Freq.WEEKLY:
      // An empty byWeekday means "the start date's weekday" server-side. With no
      // start date in scope there is no day to name, so fall back to the bare
      // frequency label rather than rendering "on " with nothing after it.
      return days.length
        ? { key: 'summary.weekly', count, weekdays: days, endDate }
        : { key: 'freq.weekly', count, weekdays: [], endDate };
    case Freq.MONTHLY:
      return rule.byMonthday === MONTHDAY_LAST
        ? { key: 'summary.monthlyLast', count, weekdays: [], endDate }
        : { key: 'summary.monthly', count, weekdays: [], day: rule.byMonthday ?? 1, endDate };
    case Freq.YEARLY:
      return { key: 'summary.yearly', count, weekdays: [], endDate };
    case Freq.DAILY:
    default:
      return { key: 'summary.daily', count, weekdays: [], endDate };
  }
};

// Whether a schedule is well-formed. Mirrors the backend's INVALID_RECURRENCE
// rules so the UI can block a doomed submit rather than round-trip for a 422.
// Returns a stable reason, not a message, so the caller owns presentation.
export type RecurrenceValidationError =
  | 'intervalOutOfRange'
  | 'weekdayRequired'
  | 'monthdayOutOfRange'
  | 'endBeforeStart'
  | null;

export const validateRecurrence = (rule: {
  freq: RecurrenceFreq;
  interval: number;
  byWeekday: number[];
  byMonthday?: number | null;
  startDate: string;
  endDate?: string | null;
}): RecurrenceValidationError => {
  if (
    !Number.isInteger(rule.interval) ||
    rule.interval < RECURRENCE_MIN_INTERVAL ||
    rule.interval > RECURRENCE_MAX_INTERVAL
  ) {
    return 'intervalOutOfRange';
  }
  // The backend tolerates an empty byWeekday (it falls back to the start date's
  // weekday), but a weekly picker showing nothing selected reads as broken — so
  // the UI insists on an explicit choice.
  if (rule.freq === Freq.WEEKLY && rule.byWeekday.length === 0) {
    return 'weekdayRequired';
  }
  if (rule.freq === Freq.MONTHLY && rule.byMonthday != null) {
    const d = rule.byMonthday;
    if (d !== MONTHDAY_LAST && (d < 1 || d > 31)) return 'monthdayOutOfRange';
  }
  // Both are ISO YYYY-MM-DD, so a lexicographic compare is a date compare.
  if (rule.endDate && rule.endDate < rule.startDate) {
    return 'endBeforeStart';
  }
  return null;
};

// Strips the fields that don't apply to the chosen frequency, so the payload
// matches what the engine actually reads — the backend rejects a byWeekday on a
// daily rule rather than ignoring it.
export const normalizeScheduleForFreq = <
  T extends { freq: RecurrenceFreq; byWeekday: number[]; byMonthday?: number | null },
>(
  schedule: T
): T => ({
  ...schedule,
  byWeekday: schedule.freq === Freq.WEEKLY ? schedule.byWeekday : [],
  byMonthday: schedule.freq === Freq.MONTHLY ? (schedule.byMonthday ?? null) : null,
});
