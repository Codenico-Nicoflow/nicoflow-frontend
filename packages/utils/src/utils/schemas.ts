import { z } from 'zod';

import { ICON_IDS } from '@my-monorepo/types';

export { ICON_IDS, type IconId } from '@my-monorepo/types';

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(20, 'Password must be less than 20 characters')
  .regex(/(?=.*[0-9])/, 'Password must contain at least one number')
  .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter');

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: passwordSchema,
  remember: z.boolean(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().email('Please enter a valid email'),
  password: passwordSchema,
});

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(50, 'Project name must be less than 50 characters'),
  categoryId: z.number().min(1, 'Please select a category'),
  icon: z.enum(ICON_IDS),
  status: z.enum(['active', 'completed', 'archived']),
  dueDate: z.date().optional(),
  isFavorite: z.boolean().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(30, 'Category name must be less than 30 characters'),
  icon: z.enum(ICON_IDS).default('briefcase'),
});

const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(30, 'Category name must be less than 30 characters')
    .optional(),
  icon: z.enum(ICON_IDS).optional(),
});

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(100, 'Task name must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Task description is required')
    .max(500, 'Description must be less than 500 characters'),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional().nullable(),
  estimatedMinutes: z
    .number()
    .min(1, 'Estimated time must be at least 1 minute')
    .max(1440, 'Estimated time must be less than 24 hours')
    .optional()
    .nullable(),
  url: z
    .string()
    .url('Please enter a valid URL')
    .or(z.literal(''))
    .optional()
    .transform(val => (val === '' ? undefined : val)),
});

const bucketSchema = z.object({
  content: z.string().min(1, 'Bucket content is required').max(500, 'Content must be less than 500 characters'),
});

const processBucketSchema = z.object({
  processingResult: z.enum(['task', 'note', 'someday', 'trash']),
  projectId: z.number().optional(),
  taskDetails: taskSchema.optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export type RegisterFormData = z.infer<typeof registerSchema>;

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export type ProjectFormData = z.output<typeof projectSchema>;

export type TaskFormData = z.output<typeof taskSchema>;

export type BucketFormData = z.infer<typeof bucketSchema>;

export type ProcessBucketFormData = z.output<typeof processBucketSchema>;

export {
  bucketSchema,
  createCategorySchema,
  forgotPasswordSchema,
  loginSchema,
  processBucketSchema,
  projectSchema,
  registerSchema,
  resetPasswordSchema,
  taskSchema,
  updateCategorySchema,
};
