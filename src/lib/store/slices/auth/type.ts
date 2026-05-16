import type { IUser } from '@/lib/types';

export type LoginRequest = {
  email: string;
  password: string;
  remember: boolean;
  platform?: 'web' | 'mobile';
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
