import type { HabitPolarity, HabitScheduleKind } from '@/lib/types';

// POST /habits. Only `name` is truly required — subject, colour, polarity and
// target all default server-side, so the minimal create is a name plus a
// schedule shape.
export type CreateHabitRequest = {
  name: string;
  subject?: string;
  color?: string;
  polarity?: HabitPolarity;
  targetValue?: number;
  unit?: string | null;
  scheduleKind: HabitScheduleKind;
  byWeekday?: number[];
  timesPerWeek?: number;
};

// PATCH /habits/:id. Partial in every field, with one deliberate omission:
// there is no `polarity`. It is immutable server-side — flipping build↔quit
// inverts the meaning of every historical check-in — and the API rejects the
// field outright, so the type refuses to let a caller try.
export type UpdateHabitRequest = {
  id: string;
  name?: string;
  subject?: string;
  color?: string;
  targetValue?: number;
  unit?: string | null;
  scheduleKind?: HabitScheduleKind;
  byWeekday?: number[];
  timesPerWeek?: number;
  archived?: boolean;
};

// POST /habits/:id/check-in.
//
// `date` is ONLY for backfilling a day the user forgot to log. Omit it for
// today: the server resolves that from the stored timezone and never trusts a
// client-supplied "today", so sending one is at best redundant and at worst a
// wrong day when a device clock has drifted.
//
// `value` defaults to the habit's target, so "I did it" is an empty body.
export type CheckInRequest = {
  id: string;
  date?: string;
  value?: number;
};

// DELETE /habits/:id/check-in. Same date rule as the check-in.
export type UndoCheckInRequest = {
  id: string;
  date?: string;
};
