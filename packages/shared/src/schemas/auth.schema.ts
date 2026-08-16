import { z } from 'zod';

// Validation messages are i18n KEYS (under the `common.validation` namespace),
// not literal copy — FormMessage runs them through t() at render. This keeps the
// schemas framework-agnostic (no i18n import) so they stay portable to the
// shared package, while error text still follows the active language.
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
  newPasswordSameAsCurrent: 'validation.newPasswordSameAsCurrent',
  firstNameRequired: 'validation.firstNameRequired',
  firstNameMax: 'validation.firstNameMax',
  lastNameMax: 'validation.lastNameMax',
  identifierRequired: 'validation.identifierRequired',
  emailInvalid: 'validation.emailInvalid',
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
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, V.identifierRequired),
  password: z.string().min(1, V.passwordRequired),
  remember: z.boolean(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(V.emailInvalid),
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: V.passwordsNoMatch,
    path: ['confirmPassword'],
  });

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().email(V.emailInvalid),
  password: passwordSchema,
});

// Settings › Account. Only firstName/lastName are editable — email and username
// are login credentials and immutable (shown read-only in the UI, rejected by
// the backend). lastName is optional; firstName is required.
export const profileSchema = z.object({
  firstName: z.string().trim().min(1, V.firstNameRequired).max(50, V.firstNameMax),
  lastName: z.string().trim().max(50, V.lastNameMax),
});

// Settings › Security. currentPassword is only "required" (the server verifies
// it); newPassword follows the register policy; confirm must match. Kept a
// separate schema from resetPassword because this flow also takes the current
// password.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, V.passwordRequired),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: V.passwordsNoMatch,
    path: ['confirmPassword'],
  })
  .refine(data => data.newPassword !== data.currentPassword, {
    message: V.newPasswordSameAsCurrent,
    path: ['newPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
