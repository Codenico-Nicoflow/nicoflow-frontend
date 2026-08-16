import type { RecurrenceFreq } from '@nicoflow/shared/types';
import { RecurrenceFreq as Freq } from '@nicoflow/shared/types';

// The schedule the field edits. `null` at the call site means "not a repeating
// task" — the absence of a value, not a disabled flag, so the parent form can
// send the whole thing or nothing.
export type RecurrenceValue = {
  freq: RecurrenceFreq;
  interval: number;
  byWeekday: number[];
  byMonthday?: number | null;
  startDate: string; // ISO "YYYY-MM-DD"
  endDate?: string | null; // null = runs forever
  scheduledTime?: string | null; // "HH:MM" on every occurrence; null = all-day
};

// Today in the user's local timezone as YYYY-MM-DD. Deliberately not
// toISOString(), which converts to UTC and can land on the wrong day.
export const todayISO = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Weekly-on-today is the least surprising default: turning "Repeats" on without
// touching anything else produces a rule that fires again next week.
//
// A function, not a const: a module-level object would freeze "today" at import
// time, so a long-lived tab (or a session open across midnight) would default to
// a stale date and the wrong weekday.
export const defaultRecurrence = (): RecurrenceValue => ({
  freq: Freq.WEEKLY,
  interval: 1,
  byWeekday: [new Date().getDay()],
  byMonthday: null,
  startDate: todayISO(),
  endDate: null,
  scheduledTime: null,
});
