import { useCallback, useEffect, useRef, useState } from 'react';

import type { ITask } from '@nicoflow/shared/types';
import { toast } from 'sonner';

import {
  invalidateApiTags,
  selectFocusLive,
  taskApi,
  useAppDispatch,
  useAppSelector,
  useCloseFocusSessionMutation,
  useFocusHeartbeatMutation,
  useOpenFocusSessionMutation,
} from '@/lib/store';
import { getApiErrorCode, showErrorToast } from '@/lib/utils';

import { HEARTBEAT_INTERVAL_MS, IDLE_TIMEOUT_MS, TICK_INTERVAL_MS } from './timerUtils';

export type FocusTimerStatus = 'starting' | 'running' | 'paused' | 'endedElsewhere';

export interface FocusTimer {
  /** Cumulative seconds on the task: server total + segments closed here + live tick. */
  seconds: number;
  status: FocusTimerStatus;
  /** An open/close request is in flight — disable the pause/resume control. */
  isBusy: boolean;
  pause: () => void;
  resume: () => void;
}

// The hybrid-lifecycle stopwatch behind the NOW card (E-049 / NIC-1713). It
// drives server segments — auto-open when a task becomes current, close on
// pause/advance/leave — and renders the cumulative display. Server-authoritative:
// the display always converges on what the backend credited, never on what this
// tab believes.
//
// Cumulative arithmetic: `base` mirrors task.totalFocusSeconds; `accrued` sums
// durationSeconds of segments closed since that server value last changed (a
// refetched total already includes them, so a change resets accrued to 0);
// `tick` is the open segment's live count from a local anchor.
export const useFocusTimer = (task: ITask | null): FocusTimer => {
  const dispatch = useAppDispatch();
  const [openSession, openState] = useOpenFocusSessionMutation();
  const [closeSession, closeState] = useCloseFocusSessionMutation();
  const [heartbeat] = useFocusHeartbeatMutation();

  const [status, setStatus] = useState<FocusTimerStatus>('starting');
  const [tick, setTick] = useState(0);
  const [accrued, setAccrued] = useState(0);
  const [base, setBase] = useState({ taskId: task?.id ?? null, total: task?.totalFocusSeconds ?? 0 });

  const statusRef = useRef(status);
  statusRef.current = status;
  const sessionIdRef = useRef<string | null>(null);
  const anchorRef = useRef(0); // Date.now() at open — the tick counts from here
  const lastActivityRef = useRef(Date.now());
  const pausedByRef = useRef<'manual' | 'auto' | null>(null);
  const wantedTaskRef = useRef<string | null>(null); // discards stale open responses

  // Derived-state reset during render: adopt the server total whenever it moves
  // (the refetch already includes everything we accrued locally).
  if (task && (base.taskId !== task.id || base.total !== task.totalFocusSeconds)) {
    setBase({ taskId: task.id, total: task.totalFocusSeconds });
    setAccrued(0);
  }

  const startSegment = useCallback(
    async (taskId: string) => {
      wantedTaskRef.current = taskId;
      setStatus('starting');
      try {
        const opened = await openSession({ taskId }).unwrap();
        if (wantedTaskRef.current !== taskId) return; // superseded by a faster switch
        sessionIdRef.current = opened.id;
        anchorRef.current = Date.now();
        lastActivityRef.current = Date.now();
        pausedByRef.current = null;
        setTick(0);
        setStatus('running');
      } catch (err) {
        if (wantedTaskRef.current !== taskId) return;
        setStatus('paused');
        pausedByRef.current = 'manual'; // don't auto-resume into a failing open
        showErrorToast(err, toast);
      }
    },
    [openSession]
  );

  const pauseSegment = useCallback(
    async (by: 'manual' | 'auto') => {
      if (statusRef.current !== 'running') return;
      pausedByRef.current = by;
      sessionIdRef.current = null;
      setStatus('paused'); // freeze immediately; the close settles the arithmetic
      // Heartbeat first: close stamps endedAt = lastSeen, so this credits the
      // seconds since the last 30s beat instead of dropping them.
      try {
        await heartbeat().unwrap();
      } catch {
        // Best-effort — a failed beat only costs sub-30s precision.
      }
      try {
        const closed = await closeSession().unwrap();
        setAccrued(a => a + closed.durationSeconds);
        setTick(0);
        // The Focus list carries totalFocusSeconds — refresh so base converges.
        invalidateApiTags(dispatch, taskApi, ['Focus']);
      } catch (err) {
        setTick(0);
        // Already closed (another tab, the sweep) is a no-op, not a user error —
        // the WS ended event settles the accrual for that case.
        if (getApiErrorCode(err) !== 'RESOURCE_NOT_FOUND') showErrorToast(err, toast);
      }
    },
    [closeSession, dispatch, heartbeat]
  );

  const pause = useCallback(() => void pauseSegment('manual'), [pauseSegment]);
  const resume = useCallback(() => {
    if (task) void startSegment(task.id);
  }, [task, startSegment]);

  // Lifecycle: open when a task becomes current (or changes — the backend
  // auto-closes the prior segment in the same transaction); close when the
  // session ends (task becomes null) or the view unmounts.
  const taskId = task?.id ?? null;
  useEffect(() => {
    if (!taskId) return;
    void startSegment(taskId);
    return () => {
      wantedTaskRef.current = null;
      if (sessionIdRef.current) {
        sessionIdRef.current = null;
        // Detached on purpose: cleanup can't await. Beat-then-close so the tail
        // seconds are credited (close stamps endedAt = lastSeen).
        void (async () => {
          try {
            await heartbeat().unwrap();
          } catch {
            // best-effort
          }
          try {
            await closeSession().unwrap();
            invalidateApiTags(dispatch, taskApi, ['Focus']);
          } catch {
            // already closed — nothing to settle
          }
        })();
      }
    };
    // startSegment/heartbeat/closeSession are stable; re-run only on task switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // Live tick + idle watchdog, only while running.
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      setTick(Math.floor((Date.now() - anchorRef.current) / 1000));
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) void pauseSegment('auto');
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, pauseSegment]);

  // ~30s heartbeat while running (hidden tabs pause, so running implies visible).
  // A RESOURCE_NOT_FOUND answer means the server already stopped the timer (the
  // stale sweep) — reflect it instead of ticking a lie; the WS ended event
  // credits whatever the segment proved.
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      heartbeat()
        .unwrap()
        .catch((err: unknown) => {
          if (getApiErrorCode(err) === 'RESOURCE_NOT_FOUND' && statusRef.current === 'running') {
            pausedByRef.current = 'auto';
            sessionIdRef.current = null;
            setTick(0);
            setStatus('paused');
          }
        });
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, heartbeat]);

  // Activity tracking: feeds the idle watchdog, and resumes an auto-pause (an
  // explicit manual pause or a takeover by another tab never auto-resumes).
  useEffect(() => {
    if (!taskId) return;
    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (statusRef.current === 'paused' && pausedByRef.current === 'auto' && !document.hidden) {
        void startSegment(taskId);
      }
    };
    const events = ['mousemove', 'keydown', 'pointerdown'] as const;
    events.forEach(e => window.addEventListener(e, onActivity));
    return () => events.forEach(e => window.removeEventListener(e, onActivity));
  }, [taskId, startSegment]);

  // Tab hidden pauses immediately; coming back resumes an auto-pause.
  useEffect(() => {
    if (!taskId) return;
    const onVisibility = () => {
      if (document.hidden) {
        void pauseSegment('auto');
      } else if (statusRef.current === 'paused' && pausedByRef.current === 'auto') {
        void startSegment(taskId);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [taskId, pauseSegment, startSegment]);

  // Cross-tab truth over WS. ended for OUR session id = the server closed it
  // without us asking (sweep, another tab's takeover): credit the measured
  // duration and stop. started with a FOREIGN id = another tab/device took over:
  // stop the zombie tick and say so — never keep counting a segment that no
  // longer exists. Our own opens/closes arrive too but are ignored: pause nulls
  // sessionIdRef before the event lands, and our own open carries the id we hold.
  const live = useAppSelector(selectFocusLive);
  useEffect(() => {
    if (!live) return;
    const { kind, session } = live;
    if (kind === 'ended' && sessionIdRef.current === session.id) {
      sessionIdRef.current = null;
      pausedByRef.current = 'auto';
      setAccrued(a => a + session.durationSeconds);
      setTick(0);
      setStatus('paused');
    }
    if (kind === 'started' && sessionIdRef.current && sessionIdRef.current !== session.id) {
      sessionIdRef.current = null;
      pausedByRef.current = 'manual'; // takeover — only an explicit resume steals back
      setTick(0);
      setStatus('endedElsewhere');
    }
    // React to each event exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.seq]);

  return {
    seconds: base.total + accrued + tick,
    status,
    isBusy: openState.isLoading || closeState.isLoading,
    pause,
    resume,
  };
};
