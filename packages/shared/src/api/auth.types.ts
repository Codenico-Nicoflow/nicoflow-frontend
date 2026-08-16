import type { IUser } from '@nicoflow/shared/types';

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

export type { ApiEnvelope } from '@nicoflow/shared/types';

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
// Mirrors the backend UpdateMeRequest. Note: email and username are immutable via
export type UpdateProfileRequest = {
  firstName?: string;
  lastName?: string;
  timezone?: string;
  theme?: IUser['theme'];
  language?: IUser['language'];
  // Calendar preferences are individually optional, so changing only the day
  // window never has to echo back a week start the client did not read.
  weekStart?: number;
  workdays?: number[];
  dayStartHour?: number;
  dayEndHour?: number;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
