import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';

// Extend Window interface to include Clerk
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
      signOut: () => Promise<void>;
    };
  }
}

export const rawBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta> =
  fetchBaseQuery({
    baseUrl: 'http://localhost:3001/',
    credentials: 'include',
    prepareHeaders: async headers => {
      // Get Clerk token
      if (typeof window !== 'undefined' && window.Clerk) {
        try {
          const token = await window.Clerk.session?.getToken();
          if (token) {
            headers.set('authorization', `Bearer ${token}`);
          }
        } catch (error) {
          console.error('Failed to get Clerk token:', error);
        }
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
    if (typeof window !== 'undefined' && window.Clerk) {
      await window.Clerk.signOut();
      window.location.href = '/sign-in';
    }
  }

  return result;
};
