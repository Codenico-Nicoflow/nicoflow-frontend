import { z } from 'zod';

const V = {
  taskTitleRequired: 'validation.taskTitleRequired',
  taskTitleMax: 'validation.taskTitleMax',
  statusInvalid: 'validation.statusInvalid',
  priorityInvalid: 'validation.priorityInvalid',
  energyInvalid: 'validation.energyInvalid',
  scheduledTimeInvalid: 'validation.scheduledTimeInvalid',
  estimatedTimeMin: 'validation.estimatedTimeMin',
  estimatedTimeMax: 'validation.estimatedTimeMax',
  urlInvalid: 'validation.urlInvalid',
} as const;

export const taskSchema = z.object({
  title: z.string().min(1, V.taskTitleRequired).max(255, V.taskTitleMax),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'done', 'cancelled'], { error: V.statusInvalid }).optional(),
  priority: z.enum(['low', 'medium', 'high'], { error: V.priorityInvalid }),
  energy: z.enum(['low', 'medium', 'deep'], { error: V.energyInvalid }),
  rollsOver: z.boolean().optional(),
  // soft intention — ISO date string "YYYY-MM-DD"
  scheduledFor: z.string().optional().nullable(),
  // "HH:MM" on a 15-minute boundary — the same value a calendar drag writes
  scheduledTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):(00|15|30|45)$/, V.scheduledTimeInvalid)
    .optional()
    .nullable(),
  estimatedMinutes: z.number().min(1, V.estimatedTimeMin).max(1440, V.estimatedTimeMax).optional().nullable(),
  url: z.string().url(V.urlInvalid).or(z.literal('')).optional().nullable(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
