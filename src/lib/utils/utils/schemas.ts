import { z } from 'zod';

import { ICON_IDS } from '@/lib/types';

export { ICON_IDS, type IconId } from '@/lib/types';

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers');

// Matches the backend policy: 8–72 chars (72 is bcrypt's truncation limit) with
// at least one uppercase and one lowercase letter. Keep in sync with the API's
// validatePassword and SPEC §3.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter');

// Login accepts either an email address or a username.
const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Password is required'),
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
  areaId: z.string().min(1, 'Please select an Area'),
  folderIcon: z.enum(ICON_IDS),
  status: z.enum(['active', 'completed', 'archived']),
  dueDate: z.date().optional(),
  isFavorite: z.boolean().optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional().nullable(),
});

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #3B82F6)')
  .optional();

const createAreaSchema = z.object({
  name: z.string().min(1, 'Area name is required').max(30, 'Area name must be less than 30 characters'),
  color: hexColorSchema,
  icon: z.enum(ICON_IDS).default('briefcase'),
});

const updateAreaSchema = z.object({
  name: z.string().min(1, 'Area name is required').max(30, 'Area name must be less than 30 characters').optional(),
  color: hexColorSchema,
  icon: z.enum(ICON_IDS).optional(),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255, 'Task title must be less than 255 characters'),
  notes: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional().nullable(),
  scheduledFor: z.enum(['today', 'tomorrow', 'this_week']).optional().nullable(),
  estimatedMinutes: z
    .number()
    .min(1, 'Estimated time must be at least 1 minute')
    .max(1440, 'Estimated time must be less than 24 hours')
    .optional()
    .nullable(),
  url: z.string().url('Please enter a valid URL').or(z.literal('')).optional().nullable(),
});

const bucketSchema = z.object({
  content: z.string().min(1, 'Bucket content is required').max(500, 'Content must be less than 500 characters'),
});

const processBucketSchema = z.object({
  processingResult: z.enum(['task', 'note', 'trash']),
  projectId: z.string().optional(),
  taskDetails: taskSchema.optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export type RegisterFormData = z.infer<typeof registerSchema>;

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export type ProjectFormData = z.output<typeof projectSchema>;

export type AreaFormData = z.input<typeof createAreaSchema>;

export type TaskFormData = z.infer<typeof taskSchema>;

export type BucketFormData = z.infer<typeof bucketSchema>;

export type ProcessBucketFormData = z.output<typeof processBucketSchema>;

export {
  bucketSchema,
  createAreaSchema,
  forgotPasswordSchema,
  loginSchema,
  processBucketSchema,
  projectSchema,
  registerSchema,
  resetPasswordSchema,
  taskSchema,
  updateAreaSchema,
};
