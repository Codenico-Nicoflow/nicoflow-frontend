import { createApi } from '@reduxjs/toolkit/query/react';

import { AUTH_API, type IUser } from '@my-monorepo/types';

import { baseQueryWithReauth } from '../baseQuery';

import { clearAuth, setUser } from './authSlice';
import type { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest } from './type';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: builder => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: userData => ({
        url: AUTH_API.LOGIN,
        method: 'POST',
        body: {
          ...userData,
          platform: 'web',
        },
        credentials: 'include',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setUser(data.user));
      },
      transformErrorResponse: error => error.data,
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: userData => ({
        url: AUTH_API.REGISTER,
        method: 'POST',
        body: {
          ...userData,
          platform: 'web',
        },
        credentials: 'include',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setUser(data.user));
      },
      transformErrorResponse: error => error.data,
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: AUTH_API.LOGOUT,
        method: 'POST',
        credentials: 'include',
      }),
      async onQueryStarted(_, { dispatch }) {
        dispatch(clearAuth());
      },
      transformErrorResponse: error => error.data,
      invalidatesTags: ['User'],
    }),
    forgotPassword: builder.mutation<void, ForgotPasswordRequest>({
      query: email => ({
        url: AUTH_API.FORGOT_PASSWORD,
        method: 'POST',
        body: email,
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
      providesTags: ['User'],
    }),
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: AUTH_API.REFRESH_TOKEN,
        method: 'POST',
        credentials: 'include',
      }),
      transformErrorResponse: error => error.data,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
} = authApi;
