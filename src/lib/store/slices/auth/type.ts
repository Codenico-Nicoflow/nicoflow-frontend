import type { IUser } from '@/lib/types';

export type LoginRequest = {
  /** Email address or username. */
  identifier: string;
  password: string;
  remember: boolean;
  platform?: 'web' | 'mobile';
  timezone?: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  username: string;
  platform?: 'web' | 'mobile';
};

export type AuthResponse = {
  token: string;
  refreshToken: string;
  user: IUser;
};

export type { ApiEnvelope } from '@/lib/types';

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  newPassword: string;
  confirmPassword: string;
  token: string;
};

export type VerifyResetTokenRequest = {
  token: string;
};

export type VerifyResetTokenResponse = {
  valid: boolean;
};

export type VerifyEmailRequest = {
  token: string;
};

export type ResendVerificationRequest = {
  email: string;
};

// PATCH /v1/users/me — all fields optional (omit a field to leave it unchanged).
// Mirrors the backend UpdateMeRequest; this story wires theme + language.
export type UpdateProfileRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
  timezone?: string;
  theme?: IUser['theme'];
  language?: IUser['language'];
};
