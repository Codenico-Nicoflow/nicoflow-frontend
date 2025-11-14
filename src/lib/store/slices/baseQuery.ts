import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';

import { AUTH_API } from '@/lib/types';

export const rawBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta> =
  fetchBaseQuery({
    baseUrl: 'http://localhost:3001/',
    credentials: 'include',
    prepareHeaders: async headers => {
      // Get token from localStorage or your auth store
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  });

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  // Ensure only one refresh runs at a time
  if (authMutex.isLocked()) {
    await authMutex.waitForUnlock();
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (!authMutex.isLocked()) {
      await authMutex.runExclusive(async () => {
        // Attempt to refresh token
        const refreshResult = await rawBaseQuery({ url: AUTH_API.REFRESH_TOKEN, method: 'POST' }, api, extraOptions);

        if (refreshResult.error) {
          // Refresh failed -> clear and redirect to sign-in
          localStorage.removeItem('authToken');
          if (typeof window !== 'undefined') {
            window.location.href = '/sign-in';
          }
          return;
        }
      });
    } else {
      await authMutex.waitForUnlock();
    }

    // Retry original request after refresh (or wait)
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

// Global mutex for coordinating refresh calls across requests
const authMutex = new Mutex();
