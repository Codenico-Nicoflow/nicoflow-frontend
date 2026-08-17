import { z } from 'zod';

import { taskSchema } from './task.schema';

const V = {
  bucketContentRequired: 'validation.bucketContentRequired',
  bucketContentMax: 'validation.bucketContentMax',
  processingResultInvalid: 'validation.processingResultInvalid',
} as const;

export const bucketSchema = z.object({
  content: z.string().min(1, V.bucketContentRequired).max(500, V.bucketContentMax),
});

export const processBucketSchema = z.object({
  processingResult: z.enum(['task', 'note', 'trash'], { error: V.processingResultInvalid }),
  projectId: z.string().optional(),
  taskDetails: taskSchema.optional(),
});

export type BucketFormData = z.infer<typeof bucketSchema>;
export type ProcessBucketFormData = z.output<typeof processBucketSchema>;
