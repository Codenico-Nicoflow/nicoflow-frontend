import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';

import { AUTH_API } from '@/lib/types';

import type { RootState } from '../store';

import { clearAuth, setToken } from './auth/authSlice';

// Global mutex for coordinating refresh calls across requests
const authMutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
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
  // Never intercept refresh-token requests — would cause infinite loop
  const url = typeof args === 'string' ? args : args.url;
  if (url === AUTH_API.REFRESH_TOKEN) {
    return rawBaseQuery(args, api, extraOptions);
  }

  if (authMutex.isLocked()) {
    await authMutex.waitForUnlock();
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (!authMutex.isLocked()) {
      await authMutex.runExclusive(async () => {
        const refreshResult = await rawBaseQuery({ url: AUTH_API.REFRESH_TOKEN, method: 'POST' }, api, extraOptions);

        if (refreshResult.error) {
          api.dispatch(clearAuth());
          if (typeof window !== 'undefined') {
            window.location.href = '/sign-in';
          }
          return;
        }

        const { token } = refreshResult.data as { token: string };
        api.dispatch(setToken(token));
      });
    } else {
      await authMutex.waitForUnlock();
    }

    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};
