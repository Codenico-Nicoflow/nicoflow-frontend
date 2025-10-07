import { fetchBaseQuery } from '@reduxjs/toolkit/query';

import { AUTH_API } from '../api/endpoints';

import { setUser, clearAuth } from './auth/authSlice';
import type { AuthResponse } from './auth/type';

import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';

export const rawBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta> =
  fetchBaseQuery({
    baseUrl: 'http://localhost:3001/',
    credentials: 'include',
  });

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    try {
      const refreshResult = await rawBaseQuery(
        {
          url: AUTH_API.REFRESH_TOKEN,
          method: 'POST',
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const { user } = refreshResult.data as AuthResponse;
        console.log('user', user);
        api.dispatch(setUser(user));

        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(clearAuth());
        // Redux Persist will automatically clear this from localStorage
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
      api.dispatch(clearAuth());
      // Redux Persist will automatically clear this from localStorage
    }
  }

  return result;
};
