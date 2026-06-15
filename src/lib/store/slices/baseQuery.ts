import type {
  BaseQueryApi,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';

import { AUTH_API } from '@/lib/types';

import type { RootState } from '../store';

import { clearAuth, setToken } from './auth/authSlice';

// Single global mutex coordinating EVERY refresh-token call in the app — both
// the on-load refresh in SessionRestorer and the on-401 refresh in baseQuery go
// through it, so only one /refresh-token request is ever in flight. This is what
// prevents the double-refresh that rotates the token and then 401s on the stale
// one (reuse detection). See refreshSession() below.
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

export type RefreshOutcome = 'refreshed' | 'failed';

// Error codes that mean the session is genuinely dead (refresh token expired,
// revoked, or rejected) and the user must be logged out. A transient failure
// (network blip / 5xx) is NOT in this set, so a persisted session survives it —
// the next request's 401 will retry the refresh.
const DEFINITIVE_AUTH_FAILURES = new Set(['INVALID_TOKEN', 'UNAUTHORIZED', 'INVALID_REFRESH_TOKEN']);

// extractErrorCode pulls the API error code out of a raw RTK Query error.
// rawBaseQuery does NOT run transformErrorResponse, so on a 401 the error is
// { status, data: <full envelope> } where the envelope is
// { data: null, error: { code, message } }. The code therefore lives at
// error.data.error.code — reading error.data.code (one level too shallow)
// yields undefined, which is the bug that left a dead session "logged in".
// We also accept already-unwrapped shapes (error.error.code / error.code) for
// safety across call sites.
const extractErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') return undefined;

  const readCode = (obj: unknown): string | undefined => {
    if (obj && typeof obj === 'object' && 'code' in obj) {
      const code = (obj as { code?: unknown }).code;
      if (typeof code === 'string') return code;
    }
    return undefined;
  };

  // Raw envelope: { data: { data, error: { code } } }
  const data = (error as { data?: unknown }).data;
  if (data && typeof data === 'object') {
    const inner = (data as { error?: unknown }).error;
    return readCode(inner) ?? readCode(data) ?? readCode(error);
  }

  // Already-unwrapped: { error: { code } } or { code }
  return readCode((error as { error?: unknown }).error) ?? readCode(error);
};

// refreshSession performs a single-flight refresh: if a refresh is already in
// flight, callers await it and share its result instead of starting a second
// one. On success it stores the new access token; on failure it clears auth.
// Both SessionRestorer (on load) and baseQuery (on 401) call this, so the token
// is only ever rotated by one request at a time.
// Holds the in-flight refresh promise so every concurrent caller awaits the SAME
// request and gets its real outcome — rather than firing a second /refresh-token
// (which would send the now-rotated token and 401 via reuse-detection) or
// guessing the result from store state after the fact.
let inFlightRefresh: Promise<RefreshOutcome> | null = null;

export const refreshSession = async (
  api: Pick<BaseQueryApi, 'dispatch' | 'getState' | 'signal' | 'abort' | 'endpoint' | 'extra' | 'type'>
): Promise<RefreshOutcome> => {
  // Single-flight: if a refresh is already running, await its actual result.
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = authMutex.runExclusive(async (): Promise<RefreshOutcome> => {
    const refreshResult = await rawBaseQuery({ url: AUTH_API.REFRESH_TOKEN, method: 'POST' }, api as BaseQueryApi, {});

    if (refreshResult.error) {
      // Only nuke the session on a definitive auth failure. A transient error
      // (network/5xx) keeps the persisted session so a reload during a backend
      // blip doesn't log the user out.
      const code = extractErrorCode(refreshResult.error);
      if (code !== undefined && DEFINITIVE_AUTH_FAILURES.has(code)) {
        api.dispatch(clearAuth());
      }
      return 'failed';
    }

    // rawBaseQuery does NOT run the endpoint's transformResponse, so this is the
    // full envelope { data: { token, ... }, error }. Unwrap .data.token — reading
    // refreshResult.data.token directly yields undefined (the classic bug: a
    // refresh that "succeeds" but stores no token, so every later request 401s).
    const { token } = (refreshResult.data as { data?: { token?: string } }).data ?? {};
    if (!token) {
      return 'failed';
    }
    api.dispatch(setToken(token));
    return 'refreshed';
  });

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
};

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  // Never intercept refresh-token requests — would cause infinite loop.
  const url = typeof args === 'string' ? args : args.url;
  if (url === AUTH_API.REFRESH_TOKEN) {
    return rawBaseQuery(args, api, extraOptions);
  }

  // If a refresh is already in flight (e.g. SessionRestorer on load), wait for it
  // so we don't send this request with a token that's about to be replaced.
  if (inFlightRefresh) {
    await inFlightRefresh;
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const outcome = await refreshSession(api);
    if (outcome === 'failed') {
      // refreshSession clears auth only on a definitive failure. Redirect to
      // sign-in only when the session was actually cleared — a transient refresh
      // failure leaves the user logged in to retry, rather than bouncing them.
      const stillAuthed = Boolean((api.getState() as RootState).auth.token);
      if (!stillAuthed && typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
      return result;
    }
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};
