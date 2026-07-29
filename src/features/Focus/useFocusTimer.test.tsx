import { createMockStore } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { focusWsEvent } from '@/lib/store';
import { makeFocusSession, makeTask } from '@/mocks/handlers';

import { useFocusTimer } from './useFocusTimer';

const OPEN_URL = 'http://localhost:8080/v1/focus/sessions';
const CLOSE_URL = 'http://localhost:8080/v1/focus/sessions/current/close';
const HEARTBEAT_URL = 'http://localhost:8080/v1/focus/sessions/current/heartbeat';

const envelope = <T,>(data: T) => ({ data, error: null });
const task = makeTask({ id: 'task-1', totalFocusSeconds: 120, estimatedMinutes: 30 });

const setup = (current = task) => {
  const store = createMockStore();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const utils = renderHook(({ t }) => useFocusTimer(t), { wrapper, initialProps: { t: current } });
  return { store, ...utils };
};

afterEach(() => {
  vi.useRealTimers();
});

// The unmount cleanup fires a detached heartbeat+close; drain it inside the
// test so it can't land on the next test's MSW handlers and skew its counters.
const drainCleanup = async (unmount: () => void) => {
  unmount();
  await new Promise(resolve => setTimeout(resolve, 30));
};

describe('useFocusTimer', () => {
  it('auto-opens a segment when a task becomes current and shows the server cumulative', async () => {
    let openedTaskId: string | null = null;
    server.use(
      http.post(OPEN_URL, async ({ request }) => {
        const body = (await request.json()) as { taskId: string };
        openedTaskId = body.taskId;
        return HttpResponse.json(envelope(makeFocusSession({ id: 'sess-a', taskId: body.taskId })), { status: 201 });
      })
    );

    const { result, unmount } = setup();
    expect(result.current.status).toBe('starting');

    await waitFor(() => expect(result.current.status).toBe('running'));
    expect(openedTaskId).toBe('task-1');
    expect(result.current.seconds).toBe(120); // base total, no tick yet
    await drainCleanup(unmount);
  });

  it('pause closes the segment, freezes, and credits the measured duration', async () => {
    let closed = false;
    server.use(
      http.post(CLOSE_URL, () => {
        closed = true;
        return HttpResponse.json(envelope(makeFocusSession({ endedAt: '2026-01-01T09:00:45Z', durationSeconds: 45 })));
      })
    );

    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    result.current.pause();
    await waitFor(() => expect(result.current.status).toBe('paused'));
    await waitFor(() => expect(closed).toBe(true));
    await waitFor(() => expect(result.current.seconds).toBe(120 + 45));
  });

  it('resume opens a new segment on top of the unchanged cumulative', async () => {
    const openedIds: string[] = [];
    server.use(
      http.post(OPEN_URL, async ({ request }) => {
        const body = (await request.json()) as { taskId: string };
        const id = `sess-${openedIds.length}`;
        openedIds.push(id);
        return HttpResponse.json(envelope(makeFocusSession({ id, taskId: body.taskId })), { status: 201 });
      }),
      http.post(CLOSE_URL, () =>
        HttpResponse.json(envelope(makeFocusSession({ endedAt: '2026-01-01T09:00:30Z', durationSeconds: 30 })))
      )
    );

    const { result, unmount } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    result.current.pause();
    await waitFor(() => expect(result.current.status).toBe('paused'));
    await waitFor(() => expect(result.current.seconds).toBe(150));

    result.current.resume();
    await waitFor(() => expect(result.current.status).toBe('running'));
    expect(openedIds).toHaveLength(2);
    expect(result.current.seconds).toBe(150); // accrued kept, new tick starts at 0
    await drainCleanup(unmount);
  });

  it('a failing open lands in paused (never a phantom running timer) and surfaces the error', async () => {
    server.use(
      http.post(OPEN_URL, () =>
        HttpResponse.json({ data: null, error: { code: 'TASK_NOT_FOUND', message: 'task not found' } }, { status: 404 })
      )
    );

    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('paused'));
  });

  it('an already-closed close (RESOURCE_NOT_FOUND) is a no-op, not a user error', async () => {
    server.use(
      http.post(CLOSE_URL, () =>
        HttpResponse.json(
          { data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'no open focus session' } },
          { status: 404 }
        )
      )
    );

    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    result.current.pause();
    await waitFor(() => expect(result.current.status).toBe('paused'));
    expect(result.current.seconds).toBe(120); // nothing credited locally; WS/refetch settles it
  });

  it('WS ended for our session credits its duration and pauses (sweep/other-tab close)', async () => {
    server.use(
      http.post(OPEN_URL, () =>
        HttpResponse.json(envelope(makeFocusSession({ id: 'sess-mine', taskId: 'task-1' })), { status: 201 })
      )
    );

    const { store, result } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    store.dispatch(
      focusWsEvent({
        kind: 'ended',
        session: makeFocusSession({ id: 'sess-mine', endedAt: '2026-01-01T09:01:00Z', durationSeconds: 60 }),
      })
    );

    await waitFor(() => expect(result.current.status).toBe('paused'));
    expect(result.current.seconds).toBe(180);
  });

  it('WS started with a foreign session stops the zombie tick (endedElsewhere)', async () => {
    server.use(
      http.post(OPEN_URL, () =>
        HttpResponse.json(envelope(makeFocusSession({ id: 'sess-mine', taskId: 'task-1' })), { status: 201 })
      )
    );

    const { store, result } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    store.dispatch(
      focusWsEvent({ kind: 'started', session: makeFocusSession({ id: 'sess-other', taskId: 'task-2' }) })
    );

    await waitFor(() => expect(result.current.status).toBe('endedElsewhere'));
  });

  it('our own started event does not disturb the running timer', async () => {
    server.use(
      http.post(OPEN_URL, () =>
        HttpResponse.json(envelope(makeFocusSession({ id: 'sess-mine', taskId: 'task-1' })), { status: 201 })
      )
    );

    const { store, result, unmount } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    store.dispatch(focusWsEvent({ kind: 'started', session: makeFocusSession({ id: 'sess-mine', taskId: 'task-1' }) }));

    await new Promise(r => setTimeout(r, 20));
    expect(result.current.status).toBe('running');
    await drainCleanup(unmount);
  });

  it('tab-hidden pauses immediately; visible again resumes the auto-pause', async () => {
    let closes = 0;
    const openedIds: string[] = [];
    server.use(
      http.post(OPEN_URL, () => {
        const id = `sess-${openedIds.length}`;
        openedIds.push(id);
        return HttpResponse.json(envelope(makeFocusSession({ id, taskId: 'task-1' })), { status: 201 });
      }),
      http.post(CLOSE_URL, () => {
        closes++;
        return HttpResponse.json(envelope(makeFocusSession({ endedAt: '2026-01-01T09:00:10Z', durationSeconds: 10 })));
      })
    );

    const { result, unmount } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => expect(result.current.status).toBe('paused'));
    await waitFor(() => expect(closes).toBe(1));

    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => expect(result.current.status).toBe('running'));
    expect(openedIds).toHaveLength(2);
    await drainCleanup(unmount);
  });

  it('a heartbeat answered RESOURCE_NOT_FOUND stops the tick (server already closed us)', async () => {
    // shouldAdvanceTime keeps real time flowing (MSW requests resolve) while
    // letting us jump the 30s heartbeat interval.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.use(
      http.post(HEARTBEAT_URL, () =>
        HttpResponse.json(
          { data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'no open focus session' } },
          { status: 404 }
        )
      )
    );

    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    await vi.advanceTimersByTimeAsync(30_000); // first heartbeat fires and 404s
    await waitFor(() => expect(result.current.status).toBe('paused'));
  });

  it('closes the open segment on unmount (leaving Focus)', async () => {
    let closed = false;
    server.use(
      http.post(CLOSE_URL, () => {
        closed = true;
        return HttpResponse.json(envelope(makeFocusSession({ endedAt: '2026-01-01T09:00:05Z', durationSeconds: 5 })));
      })
    );

    const { result, unmount } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    unmount();
    await waitFor(() => expect(closed).toBe(true));
  });

  it('adopting a refreshed server total resets the local accrual (no double count)', async () => {
    server.use(
      http.post(CLOSE_URL, () =>
        HttpResponse.json(envelope(makeFocusSession({ endedAt: '2026-01-01T09:00:30Z', durationSeconds: 30 })))
      )
    );

    const { result, rerender } = setup();
    await waitFor(() => expect(result.current.status).toBe('running'));

    result.current.pause();
    await waitFor(() => expect(result.current.seconds).toBe(150));

    // Refetched Focus list arrives: the server total now includes the 30s.
    rerender({ t: makeTask({ id: 'task-1', totalFocusSeconds: 150, estimatedMinutes: 30 }) });
    await waitFor(() => expect(result.current.seconds).toBe(150));
  });
});
