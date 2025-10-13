import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';

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
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Handle unauthorized - clear auth and redirect
    localStorage.removeItem('authToken');
    window.location.href = '/sign-in';
  }

  return result;
};
