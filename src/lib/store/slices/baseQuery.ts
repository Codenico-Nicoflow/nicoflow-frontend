import type { TokenStorage } from '@nicoflow/shared/api/adapters';
import { AUTH_API } from '@nicoflow/shared/types';
import type {
  BaseQueryApi,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';
import { toast } from 'sonner';

import i18n from '@/lib/i18n';

import { setRateLimited } from './rateLimit/rateLimitSlice';

// Single global mutex coordinating EVERY refresh-token call in the app — both
// the on-load refresh in SessionRestorer and the on-401 refresh in baseQuery go
// through it, so only one /refresh-token request is ever in flight. This is what
// prevents the double-refresh that rotates the token and then 401s on the stale
// one (reuse detection). See refreshSession() below.
const authMutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1',
  credentials: 'include',
});

// Default seconds to wait if the server didn't send Retry-After (or the browser
// can't read it — e.g. CORS not exposing it on some proxy).
const DEFAULT_RETRY_AFTER_SECONDS = 30;

const RATE_LIMIT_TOAST_ID = 'rate-limited';

// parseRetryAfter reads the Retry-After header (delta-seconds) and returns the
// retry epoch in ms, falling back to a sane default when it's absent/unreadable.
const parseRetryAfter = (meta: FetchBaseQueryMeta | undefined): number => {
  const header = meta?.response?.headers.get('Retry-After');
  const seconds = header ? Number(header) : NaN;
  const wait = Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS;
  return Date.now() + wait * 1000;
};

// handleRateLimit centralises the 429 response: it records the retry time in the
// store (drives the global banner) and shows a single throttled toast so a burst
// of 429s never stacks. Runs for EVERY request via baseQueryWithReauth.
const handleRateLimit = (api: Pick<BaseQueryApi, 'dispatch'>, meta: FetchBaseQueryMeta | undefined): void => {
  const retryAt = parseRetryAfter(meta);
  api.dispatch(setRateLimited(retryAt));
  const seconds = Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
  toast.error(i18n.t('common:rateLimit.toast', { seconds }), { id: RATE_LIMIT_TOAST_ID });
};

export type RefreshOutcome = 'refreshed' | 'failed';

// Error codes that mean the session is genuinely dead (refresh token expired,
// revoked, or rejected) and the user must be logged out. A transient failure
// (network blip / 5xx) is NOT in this set, so a persisted session survives it —
// the next request's 401 will retry the refresh.
const DEFINITIVE_AUTH_FAILURES = new Set(['INVALID_TOKEN', 'UNAUTHORIZED', 'INVALID_REFRESH_TOKEN']);

// Endpoints whose 401 is a domain error (bad credentials), not an expired token:
// skip the reauth flow so the real error reaches the caller.
const PRE_SESSION_401_ENDPOINTS = new Set<string>([
  AUTH_API.LOGIN,
  AUTH_API.REGISTER,
  AUTH_API.FORGOT_PASSWORD,
  AUTH_API.RESET_PASSWORD,
  AUTH_API.CHANGE_PASSWORD,
]);

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

// Holds the in-flight refresh promise so every concurrent caller awaits the SAME
// request and gets its real outcome — rather than firing a second /refresh-token
// (which would send the now-rotated token and 401 via reuse-detection) or
// guessing the result from store state after the fact. Module-scoped (not inside
// the factory below) so it stays a true single global gate regardless of how many
// times createAuthFlow's callers construct a baseQueryWithReauth instance.
let inFlightRefresh: Promise<RefreshOutcome> | null = null;

// refreshSession performs a single-flight refresh: if a refresh is already in
// flight, callers await it and share its result instead of starting a second
// one. On success it stores the new access token via tokenStorage; on failure
// it clears auth via tokenStorage. Both SessionRestorer (on load) and
// baseQuery (on 401) call this, so the token is only ever rotated by one
// request at a time. tokenStorage is the only platform-specific seam — every
// other line of this refresh/mutex/reuse-detection logic is unchanged from
// before this was made platform-agnostic (see @nicoflow/shared/api/adapters).
const refreshSession = async (
  tokenStorage: TokenStorage,
  api: Pick<BaseQueryApi, 'dispatch' | 'getState' | 'signal' | 'abort' | 'endpoint' | 'extra' | 'type'>
): Promise<RefreshOutcome> => {
  // Single-flight: if a refresh is already running, await its actual result.
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = authMutex.runExclusive(async (): Promise<RefreshOutcome> => {
    const refreshResult = await rawBaseQuery({ url: AUTH_API.REFRESH_TOKEN, method: 'POST' }, api as BaseQueryApi, {});

    if (refreshResult.error) {
      // A rate-limited refresh is transient: keep the session and surface the
      // limit so a reload-storm doesn't look like a broken app or log the user out.
      if (refreshResult.error.status === 429) {
        handleRateLimit(api, refreshResult.meta);
        return 'failed';
      }
      // Only nuke the session on a definitive auth failure. A transient error
      // (network/5xx) keeps the persisted session so a reload during a backend
      // blip doesn't log the user out.
      const code = extractErrorCode(refreshResult.error);
      if (code !== undefined && DEFINITIVE_AUTH_FAILURES.has(code)) {
        await tokenStorage.clear();
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
    tokenStorage.setAccessToken(token);
    return 'refreshed';
  });

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
};

// refreshSessionFromStore lets non-RTK-Query callers (e.g. the WebSocket hook) run
// the SAME single-flight refresh the rest of the app uses, sharing the one mutex +
// in-flight-promise guard. This is the only sanctioned refresh entry point outside
// baseQuery — never call /auth/refresh-token directly from a component, or two
// refreshes can race and replay the rotated token into backend reuse-detection.
// Returns the fresh access token on success, or null on any failure.
export const refreshSessionFromStore = async (
  tokenStorage: TokenStorage,
  dispatch: BaseQueryApi['dispatch']
): Promise<string | null> => {
  const controller = new AbortController();
  const outcome = await refreshSession(tokenStorage, {
    dispatch,
    getState: () => ({}),
    signal: controller.signal,
    abort: (reason?: string) => controller.abort(reason),
    endpoint: 'refreshSessionFromStore',
    extra: undefined,
    type: 'query',
  });
  return outcome === 'refreshed' ? tokenStorage.getAccessToken() : null;
};

// createBaseQueryWithReauth builds the app's base query around an injected
// TokenStorage — web reads/writes the Redux `auth` slice; a future mobile app
// would read/write expo-secure-store. Everything else (401 → mutex-guarded
// refresh → retry, 429 handling, the pre-session-401 skip list) is unchanged.
export const createBaseQueryWithReauth = (
  tokenStorage: TokenStorage
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta> => {
  const authedRawBaseQuery: typeof rawBaseQuery = (args, api, extraOptions) => {
    const token = tokenStorage.getAccessToken();
    const withAuth =
      typeof args === 'string'
        ? token
          ? { url: args, headers: { authorization: `Bearer ${token}` } }
          : args
        : { ...args, headers: token ? { ...args.headers, authorization: `Bearer ${token}` } : args.headers };
    return rawBaseQuery(withAuth, api, extraOptions);
  };

  return async (args, api, extraOptions) => {
    // Never intercept refresh-token requests — would cause infinite loop.
    const url = typeof args === 'string' ? args : args.url;
    if (url === AUTH_API.REFRESH_TOKEN) {
      return authedRawBaseQuery(args, api, extraOptions);
    }

    // These 401s are domain errors — running the reauth flow fires a spurious
    // /refresh-token that swallows the real error (wrong-password login showed
    // no feedback). Let the caller handle it.
    if (PRE_SESSION_401_ENDPOINTS.has(url)) {
      return authedRawBaseQuery(args, api, extraOptions);
    }

    // If a refresh is already in flight (e.g. SessionRestorer on load), wait for it
    // so we don't send this request with a token that's about to be replaced.
    if (inFlightRefresh) {
      await inFlightRefresh;
    }

    let result = await authedRawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 429) {
      handleRateLimit(api, result.meta);
      return result;
    }

    if (result.error?.status === 401) {
      const outcome = await refreshSession(tokenStorage, api);
      if (outcome === 'failed') {
        // refreshSession clears auth only on a definitive failure. Redirect to
        // sign-in only when the session was actually cleared — a transient refresh
        // failure leaves the user logged in to retry, rather than bouncing them.
        const stillAuthed = Boolean(tokenStorage.getAccessToken());
        if (!stillAuthed && typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
        return result;
      }
      result = await authedRawBaseQuery(args, api, extraOptions);
      if (result.error?.status === 429) {
        handleRateLimit(api, result.meta);
      }
    }

    return result;
  };
};
