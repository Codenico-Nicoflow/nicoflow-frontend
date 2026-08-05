import { z } from 'zod';

// The habit form schema mirrors the backend's shape rules so the common invalid
// states never round-trip. The server stays authoritative — this is a courtesy
// to the user, not a security boundary.
//
// There is deliberately no `polarity` field on the edit path: it is immutable
// server-side, and the dialog omits the control entirely rather than disabling
// it (see HabitFormDialog).
export const habitSchema = z
  .object({
    name: z.string().trim().min(1, 'form.errors.nameRequired').max(255, 'form.errors.nameTooLong'),
    subject: z.string().min(1),
    polarity: z.enum(['build', 'quit']),
    targetValue: z.number().int().min(0, 'form.errors.targetNegative'),
    unit: z.string().trim().max(32).optional().or(z.literal('')),
    scheduleKind: z.enum(['daily', 'weekdays', 'weekly_quota']),
    byWeekday: z.array(z.number().int().min(0).max(6)),
    timesPerWeek: z.number().int().min(1).max(7),
  })
  // A build habit with a target of 0 is satisfied by doing nothing, so the
  // server rejects it. Catch it here rather than letting the user submit into a
  // 422 they can't act on.
  .refine(v => !(v.polarity === 'build' && v.targetValue === 0), {
    message: 'form.errors.targetZeroOnBuild',
    path: ['targetValue'],
  })
  // The shape rule the DB CHECK also holds: a weekdays habit needs days.
  .refine(v => v.scheduleKind !== 'weekdays' || v.byWeekday.length > 0, {
    message: 'form.errors.weekdaysRequired',
    path: ['byWeekday'],
  });

export type HabitFormData = z.infer<typeof habitSchema>;

// Defaults for a fresh habit: a daily, binary, build habit — the shape most
// people describe first ("I want to read every day").
export const emptyHabitForm: HabitFormData = {
  name: '',
  subject: 'custom',
  polarity: 'build',
  targetValue: 1,
  unit: '',
  scheduleKind: 'daily',
  byWeekday: [],
  timesPerWeek: 3,
};
