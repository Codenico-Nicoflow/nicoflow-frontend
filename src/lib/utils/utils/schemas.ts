import { z } from 'zod';

import { ICON_IDS } from '@/lib/types';

export { ICON_IDS, type IconId } from '@/lib/types';

// Validation messages are i18n KEYS (under the `common.validation` namespace),
// not literal copy — FormMessage runs them through t() at render. This keeps the
// schemas framework-agnostic (no i18n import) so they stay portable to the
// future shared package, while error text still follows the active language.
const V = {
  usernameMin: 'validation.usernameMin',
  usernameMax: 'validation.usernameMax',
  usernameFormat: 'validation.usernameFormat',
  passwordMin: 'validation.passwordMin',
  passwordMax: 'validation.passwordMax',
  passwordUppercase: 'validation.passwordUppercase',
  passwordLowercase: 'validation.passwordLowercase',
  passwordRequired: 'validation.passwordRequired',
  passwordsNoMatch: 'validation.passwordsNoMatch',
  firstNameRequired: 'validation.firstNameRequired',
  firstNameMax: 'validation.firstNameMax',
  lastNameMax: 'validation.lastNameMax',
  identifierRequired: 'validation.identifierRequired',
  emailInvalid: 'validation.emailInvalid',
  projectNameRequired: 'validation.projectNameRequired',
  projectNameMax: 'validation.projectNameMax',
  areaRequired: 'validation.areaRequired',
  descriptionMax: 'validation.descriptionMax',
  colorInvalid: 'validation.colorInvalid',
  iconInvalid: 'validation.iconInvalid',
  statusInvalid: 'validation.statusInvalid',
  priorityInvalid: 'validation.priorityInvalid',
  energyInvalid: 'validation.energyInvalid',
  areaNameRequired: 'validation.areaNameRequired',
  areaNameMax: 'validation.areaNameMax',
  taskTitleRequired: 'validation.taskTitleRequired',
  taskTitleMax: 'validation.taskTitleMax',
  estimatedTimeMin: 'validation.estimatedTimeMin',
  estimatedTimeMax: 'validation.estimatedTimeMax',
  urlInvalid: 'validation.urlInvalid',
  bucketContentRequired: 'validation.bucketContentRequired',
  bucketContentMax: 'validation.bucketContentMax',
  processingResultInvalid: 'validation.processingResultInvalid',
} as const;

const usernameSchema = z
  .string()
  .min(3, V.usernameMin)
  .max(20, V.usernameMax)
  .regex(/^[a-zA-Z0-9]+$/, V.usernameFormat);

// Matches the backend policy: 8–72 chars (72 is bcrypt's truncation limit) with
// at least one uppercase and one lowercase letter. Keep in sync with the API's
// validatePassword and SPEC §3.
const passwordSchema = z
  .string()
  .min(8, V.passwordMin)
  .max(72, V.passwordMax)
  .regex(/[A-Z]/, V.passwordUppercase)
  .regex(/[a-z]/, V.passwordLowercase);

// Login accepts either an email address or a username.
const loginSchema = z.object({
  identifier: z.string().trim().min(1, V.identifierRequired),
  password: z.string().min(1, V.passwordRequired),
  remember: z.boolean(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(V.emailInvalid),
});

const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: V.passwordsNoMatch,
    path: ['confirmPassword'],
  });

const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().email(V.emailInvalid),
  password: passwordSchema,
});

// Settings › Account. Only firstName/lastName are editable — email and username
// are login credentials and immutable (shown read-only in the UI, rejected by
// the backend). lastName is optional; firstName is required.
const profileSchema = z.object({
  firstName: z.string().trim().min(1, V.firstNameRequired).max(50, V.firstNameMax),
  lastName: z.string().trim().max(50, V.lastNameMax),
});

// Settings › Security. currentPassword is only "required" (the server verifies
// it); newPassword follows the register policy; confirm must match. Kept a
// separate schema from resetPassword because this flow also takes the current
// password.
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, V.passwordRequired),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: V.passwordsNoMatch,
    path: ['confirmPassword'],
  });

const projectSchema = z.object({
  name: z.string().min(1, V.projectNameRequired).max(50, V.projectNameMax),
  areaId: z.string().min(1, V.areaRequired),
  folderIcon: z.enum(ICON_IDS, { error: V.iconInvalid }),
  status: z.enum(['active', 'completed', 'archived'], { error: V.statusInvalid }),
  dueDate: z.date().optional(),
  isFavorite: z.boolean().optional(),
  description: z.string().max(2000, V.descriptionMax).optional().nullable(),
});

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, V.colorInvalid)
  .optional();

const createAreaSchema = z.object({
  name: z.string().min(1, V.areaNameRequired).max(30, V.areaNameMax),
  color: hexColorSchema,
  icon: z.enum(ICON_IDS, { error: V.iconInvalid }).default('briefcase'),
});

const updateAreaSchema = z.object({
  name: z.string().min(1, V.areaNameRequired).max(30, V.areaNameMax).optional(),
  color: hexColorSchema,
  icon: z.enum(ICON_IDS, { error: V.iconInvalid }).optional(),
});

const taskSchema = z.object({
  title: z.string().min(1, V.taskTitleRequired).max(255, V.taskTitleMax),
  notes: z.string().optional().nullable(),
  status: z.enum(['inbox', 'active', 'someday', 'done', 'cancelled'], { error: V.statusInvalid }).optional(),
  priority: z.enum(['low', 'medium', 'high'], { error: V.priorityInvalid }),
  energy: z.enum(['low', 'medium', 'deep'], { error: V.energyInvalid }),
  rollsOver: z.boolean().optional(),
  // soft intention — ISO date string "YYYY-MM-DD"
  scheduledFor: z.string().optional().nullable(),
  estimatedMinutes: z.number().min(1, V.estimatedTimeMin).max(1440, V.estimatedTimeMax).optional().nullable(),
  url: z.string().url(V.urlInvalid).or(z.literal('')).optional().nullable(),
});

const bucketSchema = z.object({
  content: z.string().min(1, V.bucketContentRequired).max(500, V.bucketContentMax),
});

const processBucketSchema = z.object({
  processingResult: z.enum(['task', 'note', 'trash'], { error: V.processingResultInvalid }),
  projectId: z.string().optional(),
  taskDetails: taskSchema.optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export type RegisterFormData = z.infer<typeof registerSchema>;

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export type ProfileFormData = z.infer<typeof profileSchema>;

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export type ProjectFormData = z.output<typeof projectSchema>;

export type AreaFormData = z.input<typeof createAreaSchema>;

export type TaskFormData = z.infer<typeof taskSchema>;

export type BucketFormData = z.infer<typeof bucketSchema>;

export type ProcessBucketFormData = z.output<typeof processBucketSchema>;

export {
  bucketSchema,
  changePasswordSchema,
  createAreaSchema,
  forgotPasswordSchema,
  loginSchema,
  processBucketSchema,
  profileSchema,
  projectSchema,
  registerSchema,
  resetPasswordSchema,
  taskSchema,
  updateAreaSchema,
};
