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
  icon: z.enum(ICON_IDS).default('folder'),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  dueDate: z
    .date()
    .optional()
    .or(z.null())
    .transform(val => (val === null ? undefined : val)),
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

export type LoginFormData = z.infer<typeof loginSchema>;

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export type RegisterFormData = z.infer<typeof registerSchema>;

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export type ProjectFormData = z.output<typeof projectSchema>;

export {
  createCategorySchema,
  forgotPasswordSchema,
  loginSchema,
  projectSchema,
  registerSchema,
  resetPasswordSchema,
  updateCategorySchema,
};
