import { useCallback, useEffect, useRef, useState } from 'react';

import { useStore } from 'react-redux';

import type { RootState } from '@/lib/store';
import {
  aiApi,
  areaApi,
  attachmentApi,
  bucketApi,
  invalidateApiTags,
  notificationApi,
  projectApi,
  recurrenceApi,
  refreshSessionFromStore,
  searchApi,
  subtaskApi,
  taskApi,
  useAppDispatch,
  useAppSelector,
  useAppUser,
} from '@/lib/store';

import { attachmentOwnerId, WS_EVENT_TAGS, type WsEvent } from './events';
import { buildWsUrl } from './wsUrl';

// Reconnect backoff: 1 → 2 → 4 → 8 → 16 → 30s (capped). Reset to the first step on
// a clean open, so a flaky connection that keeps dropping slows down but a genuine
// reconnect starts fast again. Retries are unbounded at the 30s cap — a live socket
// self-heals when the backend recovers; the paused banner is the standing signal.
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
  const store = useStore<RootState>();
  const user = useAppUser();
  const token = useAppSelector(state => state.auth.token);
  const hasToken = Boolean(token);

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
    (event: string, payload: unknown) => {
      // Attachment events invalidate per owner — { type: 'Attachment', id: ownerId }
      // from the payload — so they're handled outside the flat WS_EVENT_TAGS map.
      const ownerId = attachmentOwnerId(event, payload);
      if (ownerId) {
        invalidateApiTags(dispatch, attachmentApi, [{ type: 'Attachment', id: ownerId }]);
        return;
      }

      const tags = WS_EVENT_TAGS[event];
      if (!tags) return; // unknown event → no-op (forward-compatible)
      const has = (tag: string) => tags.includes(tag);

      const notificationTags = (['Notification', 'NotificationCount'] as const).filter(has);
      if (notificationTags.length > 0) invalidateApiTags(dispatch, notificationApi, notificationTags);

      const taskTags = (['Task', 'Focus', 'TimeSpread'] as const).filter(has);
      if (taskTags.length > 0) invalidateApiTags(dispatch, taskApi, taskTags);

      const subtaskTags = (['Subtask'] as const).filter(has);
      if (subtaskTags.length > 0) invalidateApiTags(dispatch, subtaskApi, subtaskTags);

      const projectTags = (['Project'] as const).filter(has);
      if (projectTags.length > 0) invalidateApiTags(dispatch, projectApi, projectTags);

      const areaTags = (['Area'] as const).filter(has);
      if (areaTags.length > 0) invalidateApiTags(dispatch, areaApi, areaTags);

      const bucketTags = (['Bucket'] as const).filter(has);
      if (bucketTags.length > 0) invalidateApiTags(dispatch, bucketApi, bucketTags);

      const searchTags = (['Search'] as const).filter(has);
      if (searchTags.length > 0) invalidateApiTags(dispatch, searchApi, searchTags);

      const aiTags = (['AISession'] as const).filter(has);
      if (aiTags.length > 0) invalidateApiTags(dispatch, aiApi, aiTags);

      const recurrenceTags = (['RecurrenceRule', 'RecurrenceStats'] as const).filter(has);
      if (recurrenceTags.length > 0) invalidateApiTags(dispatch, recurrenceApi, recurrenceTags);
    },
    [dispatch]
  );

  useEffect(() => {
    // Only open once a token exists. We deliberately do NOT refresh the token here to
    // obtain one — the app's policy is no eager on-load refresh (see baseQuery); the
    // socket simply waits for the normal flow (SessionRestorer / first authed query)
    // to populate the token, at which point `hasToken` flips and this effect re-runs.
    if (!user || !hasToken) return;
    closedRef.current = false;

    // connect opens one socket, reading the current token from the store so a
    // post-refresh reconnect always uses the latest value (never a stale closure).
    const connect = () => {
      if (closedRef.current) return;
      const live = store.getState().auth.token;
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
        if (parsed) dispatchTags(parsed.event, parsed.payload);
      };

      socket.onclose = async event => {
        socketRef.current = null;
        if (closedRef.current) return;

        // Bad/expired token → refresh once (through the shared single-flight path so
        // it can never race the app's other refreshes into reuse-detection), then
        // reconnect. A second consecutive 1008 falls through to plain backoff.
        if (event.code === CLOSE_POLICY_VIOLATION && !refreshedForCloseRef.current) {
          refreshedForCloseRef.current = true;
          const fresh = await refreshSessionFromStore(dispatch, store.getState);
          if (closedRef.current) return;
          if (fresh) {
            connect();
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
      timerRef.current = setTimeout(connect, delay);
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
    // Re-run on login/logout (user identity) and when a token first appears. Token
    // rotation mid-session is NOT a trigger — the socket reads the live token from
    // the store on each (re)connect, so a healthy socket is never torn down on refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasToken]);

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
