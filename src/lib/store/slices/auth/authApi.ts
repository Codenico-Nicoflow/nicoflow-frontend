import { createApi } from '@reduxjs/toolkit/query/react';

import { AUTH_API, type IUser } from '@/lib/types';
import { resolveTimeZone } from '@/lib/utils';

import { baseQueryWithReauth } from '../baseQuery';

import { clearAuth, setToken, setUser } from './authSlice';
import type {
  ApiEnvelope,
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  VerifyEmailRequest,
} from './type';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: builder => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: userData => ({
        url: AUTH_API.LOGIN,
        method: 'POST',
        body: { ...userData, platform: 'web', timezone: resolveTimeZone() },
        credentials: 'include',
      }),
      transformResponse: (raw: ApiEnvelope<AuthResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: userData => ({
        url: AUTH_API.REGISTER,
        method: 'POST',
        body: { ...userData, platform: 'web' },
        credentials: 'include',
      }),
      transformResponse: (raw: ApiEnvelope<AuthResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: AUTH_API.LOGOUT,
        method: 'POST',
        credentials: 'include',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearAuth());
        }
      },
      transformErrorResponse: error => error.data,
      invalidatesTags: ['User'],
    }),
    logoutAll: builder.mutation<void, void>({
      query: () => ({
        url: AUTH_API.LOGOUT_ALL,
        method: 'POST',
        credentials: 'include',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearAuth());
        }
      },
      transformErrorResponse: error => error.data,
      invalidatesTags: ['User'],
    }),
    forgotPassword: builder.mutation<void, ForgotPasswordRequest>({
      query: body => ({
        url: AUTH_API.FORGOT_PASSWORD,
        method: 'POST',
        body,
      }),
      transformErrorResponse: error => error.data,
    }),
    verifyEmail: builder.mutation<void, VerifyEmailRequest>({
      query: body => ({
        url: AUTH_API.VERIFY_EMAIL,
        method: 'POST',
        body,
      }),
      transformErrorResponse: error => error.data,
    }),
    resendVerification: builder.mutation<void, ResendVerificationRequest>({
      query: body => ({
        url: AUTH_API.RESEND_VERIFICATION,
        method: 'POST',
        body,
      }),
      transformErrorResponse: error => error.data,
    }),
    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: data => ({
        url: AUTH_API.RESET_PASSWORD,
        method: 'POST',
        body: data,
      }),
      transformErrorResponse: error => error.data,
    }),
    getCurrentUser: builder.query<IUser, void>({
      query: () => ({
        url: AUTH_API.GET_CURRENT_USER,
        method: 'GET',
        credentials: 'include',
      }),
      transformResponse: (raw: ApiEnvelope<IUser>) => raw.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setUser(data));
      },
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<IUser, UpdateProfileRequest>({
      query: body => ({
        url: AUTH_API.UPDATE_PROFILE,
        method: 'PATCH',
        body,
        credentials: 'include',
      }),
      transformResponse: (raw: ApiEnvelope<IUser>) => raw.data,
      // Persist the returned user back into the auth slice so the rest of the app
      // (and the persisted store) immediately reflects the new theme/language.
      //
      // A rejected `queryFulfilled` is swallowed here on purpose: the caller
      // handles the failure via `.unwrap()`, and leaving this promise unhandled
      // surfaces as an unhandled rejection independent of that catch.
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          // Nothing to persist — the profile is unchanged.
        }
      },
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<AuthResponse, ChangePasswordRequest>({
      query: body => ({
        url: AUTH_API.CHANGE_PASSWORD,
        method: 'POST',
        body,
        credentials: 'include',
      }),
      transformResponse: (raw: ApiEnvelope<AuthResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      // Persist the rotated token pair on success. Swallow the rejection here —
      // the 401 (wrong current password) is handled at the call site; leaving
      // queryFulfilled un-caught surfaces an unhandled rejection.
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setToken(data.token));
          dispatch(setUser(data.user));
        } catch {
          // handled by the component
        }
      },
      invalidatesTags: ['User'],
    }),
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: AUTH_API.REFRESH_TOKEN,
        method: 'POST',
        credentials: 'include',
      }),
      transformResponse: (raw: ApiEnvelope<AuthResponse>) => raw.data,
      transformErrorResponse: error => error.data,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRefreshTokenMutation,
} = authApi;
