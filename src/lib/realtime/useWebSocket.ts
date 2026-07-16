import { useCallback, useEffect, useRef, useState } from 'react';

import {
  bucketApi,
  invalidateApiTags,
  notificationApi,
  taskApi,
  useAppDispatch,
  useAppSelector,
  useAppUser,
  useRefreshTokenMutation,
} from '@/lib/store';

import { WS_EVENT_TAGS, type WsEvent } from './events';
import { isTokenExpiring } from './token';
import { buildWsUrl } from './wsUrl';

// Reconnect backoff: 1 → 2 → 4 → 8 → 16 → 30s (capped). Reset to the first step on
// a clean open, so a flaky connection that keeps dropping slows down but a genuine
// reconnect starts fast again.
const BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000] as const;

// Show the "paused" banner only after we've actually failed to hold a connection —
// i.e. past the first retry — so a momentary reconnect during navigation doesn't
// flash a scary banner. Index into BACKOFF_MS at which the banner appears.
const BANNER_AFTER_ATTEMPT = 1;

// The 1008 policy-violation close code the API sends for a bad/expired token. On
// this we refresh once, then reconnect with the fresh token.
const CLOSE_POLICY_VIOLATION = 1008;

// useWebSocket opens a single live connection to /v1/ws for every logged-in user
// (WS is FREE — not Pro-gated) and turns inbound events into tag invalidations.
// Returns whether the "Live updates paused" banner should show. One socket only:
// the effect owns exactly one WebSocket at a time and tears it down on cleanup.
export const useWebSocket = (): { paused: boolean } => {
  const dispatch = useAppDispatch();
  const user = useAppUser();
  const token = useAppSelector(state => state.auth.token);
  const [refreshToken] = useRefreshTokenMutation();

  const [paused, setPaused] = useState(false);

  // Mutable connection state kept in refs so reconnect scheduling never re-runs the
  // effect (which would tear down a healthy socket). The effect runs once per login.
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false); // set on unmount so late callbacks don't reconnect
  const refreshedForCloseRef = useRef(false); // guard: refresh at most once per 1008

  // Map a WS event to its tags and invalidate on the api that owns each — one call
  // per owning api, with that api's own tag literals so the types stay exact. We
  // invalidate (not cache-patch) so the tag/refetch model stays the source of truth.
  const dispatchTags = useCallback(
    (event: string) => {
      const tags = WS_EVENT_TAGS[event];
      if (!tags) return; // unknown event → no-op (forward-compatible)
      const has = (tag: string) => tags.includes(tag);

      const notificationTags = (['Notification', 'NotificationCount'] as const).filter(has);
      if (notificationTags.length > 0) invalidateApiTags(dispatch, notificationApi, notificationTags);

      const taskTags = (['Task', 'Focus', 'TimeSpread'] as const).filter(has);
      if (taskTags.length > 0) invalidateApiTags(dispatch, taskApi, taskTags);

      const bucketTags = (['Bucket'] as const).filter(has);
      if (bucketTags.length > 0) invalidateApiTags(dispatch, bucketApi, bucketTags);
    },
    [dispatch]
  );

  useEffect(() => {
    if (!user) return; // not logged in → no socket
    closedRef.current = false;

    // connect opens one socket. tokenOverride carries a freshly refreshed token so a
    // post-1008 reconnect doesn't read a stale value from the closed-over `token`.
    const connect = async (tokenOverride?: string) => {
      if (closedRef.current) return;

      let live = tokenOverride ?? token;
      // Pre-connect freshness: a token expiring mid-handshake earns an instant 1008.
      // Refresh first so we open with a token that will outlive the upgrade.
      if (isTokenExpiring(live)) {
        const fresh = await refreshOnce();
        if (closedRef.current) return;
        if (fresh) live = fresh;
      }
      if (!live) {
        scheduleReconnect();
        return;
      }

      const socket = new WebSocket(buildWsUrl(live));
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        refreshedForCloseRef.current = false;
        setPaused(false);
      };

      socket.onmessage = e => {
        const parsed = safeParse(e.data);
        if (parsed) dispatchTags(parsed.event);
      };

      socket.onclose = async event => {
        socketRef.current = null;
        if (closedRef.current) return;

        // Bad/expired token → refresh once, then reconnect with it immediately.
        if (event.code === CLOSE_POLICY_VIOLATION && !refreshedForCloseRef.current) {
          refreshedForCloseRef.current = true;
          const fresh = await refreshOnce();
          if (closedRef.current) return;
          if (fresh) {
            connect(fresh);
            return;
          }
        }
        scheduleReconnect();
      };

      // onerror is followed by onclose; let onclose own the reconnect so we don't
      // schedule twice. Closing here guarantees onclose fires.
      socket.onerror = () => socket.close();
    };

    const scheduleReconnect = () => {
      if (closedRef.current) return;
      const attempt = attemptRef.current;
      if (attempt >= BANNER_AFTER_ATTEMPT) setPaused(true);
      const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
      attemptRef.current = attempt + 1;
      timerRef.current = setTimeout(() => connect(), delay);
    };

    // refreshOnce runs the shared refresh mutation and returns the new token, or null
    // on failure. The mutation is itself single-flight-safe (baseQuery mutex).
    const refreshOnce = async (): Promise<string | null> => {
      try {
        const data = await refreshToken().unwrap();
        return data.token ?? null;
      } catch {
        return null;
      }
    };

    connect();

    return () => {
      closedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.onclose = null; // prevent the teardown close from scheduling a reconnect
        socket.close();
      }
    };
    // Re-run only when the user identity changes (login/logout). Token rotation is
    // handled inside via refreshOnce, deliberately NOT a dependency — a new token on
    // every refresh must not tear down and reopen a healthy socket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { paused };
};

const safeParse = (raw: unknown): WsEvent | null => {
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as WsEvent;
    return typeof parsed?.event === 'string' ? parsed : null;
  } catch {
    return null;
  }
};
