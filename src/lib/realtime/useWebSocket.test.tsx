import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  areaApi,
  attachmentApi,
  bucketApi,
  notificationApi,
  projectApi,
  searchApi,
  subtaskApi,
  taskApi,
} from '@/lib/store';

import { createMockStore } from '../../../__tests__/renderComponent';

import { useWebSocket } from './useWebSocket';

// A controllable WebSocket stand-in: tests drive open/message/close by hand and
// inspect what was constructed (URL + how many sockets ever existed → single-socket).
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  onopen: (() => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  readonly url: string;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
  close() {
    this.closed = true;
  }
  emitOpen() {
    this.onopen?.();
  }
  emitMessage(data: string) {
    this.onmessage?.({ data });
  }
  emitClose(code = 1006) {
    this.onclose?.({ code });
  }
}

const user = {
  id: 'u1',
  email: 'a@b.co',
  firstName: 'A',
  lastName: 'B',
  username: 'ab',
  theme: 'light' as const,
  language: 'en' as const,
  timezone: 'UTC',
  imageUrl: '',
  status: 'regular' as const,
};

// A token comfortably in the future so the pre-connect freshness check doesn't fire.
const freshToken = () => {
  const exp = Math.floor((Date.now() + 3_600_000) / 1000);
  return `h.${btoa(JSON.stringify({ sub: 'u1', exp }))}.s`;
};

const wrapper =
  (store: ReturnType<typeof createMockStore>) =>
  ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

describe('useWebSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens one socket for a logged-in user and invalidates on notification.created', async () => {
    const store = createMockStore({ auth: { user, token: freshToken() } });
    const spy = vi.spyOn(notificationApi.util, 'invalidateTags');

    renderHook(() => useWebSocket(), { wrapper: wrapper(store) });

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0]!;
    expect(socket.url).toContain('/ws?token=');

    socket.emitOpen();
    socket.emitMessage(JSON.stringify({ event: 'notification.created', payload: {}, timestamp: '' }));

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith([['Notification'], ['NotificationCount']].flat());
  });

  it('invalidates the task family + Focus + TimeSpread on a task event (incl. TimeSpread cross-tab)', async () => {
    const store = createMockStore({ auth: { user, token: freshToken() } });
    const taskSpy = vi.spyOn(taskApi.util, 'invalidateTags');
    const subtaskSpy = vi.spyOn(subtaskApi.util, 'invalidateTags');

    renderHook(() => useWebSocket(), { wrapper: wrapper(store) });
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0]!;
    socket.emitOpen();
    socket.emitMessage(JSON.stringify({ event: 'task.updated', payload: {}, timestamp: '' }));

    await waitFor(() => expect(taskSpy).toHaveBeenCalledWith(['Task', 'Focus', 'TimeSpread']));
    // Subtask lives in its own api — the backend reuses task.updated for subtasks.
    expect(subtaskSpy).toHaveBeenCalledWith(['Subtask']);
  });

  it('invalidates Project + Area + Search on a project event (areas board nests projects)', async () => {
    const store = createMockStore({ auth: { user, token: freshToken() } });
    const projectSpy = vi.spyOn(projectApi.util, 'invalidateTags');
    const areaSpy = vi.spyOn(areaApi.util, 'invalidateTags');
    const searchSpy = vi.spyOn(searchApi.util, 'invalidateTags');

    renderHook(() => useWebSocket(), { wrapper: wrapper(store) });
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0]!;
    socket.emitOpen();
    socket.emitMessage(JSON.stringify({ event: 'project.updated', payload: {}, timestamp: '' }));

    // Area invalidation is what re-renders the areas board (ListWithProjects).
    await waitFor(() => expect(areaSpy).toHaveBeenCalledWith(['Area']));
    expect(projectSpy).toHaveBeenCalledWith(['Project']);
    expect(searchSpy).toHaveBeenCalledWith(['Search']);
  });

  it('invalidates Area on an area event and Bucket on a bucket event', async () => {
    const store = createMockStore({ auth: { user, token: freshToken() } });
    const areaSpy = vi.spyOn(areaApi.util, 'invalidateTags');
    const bucketSpy = vi.spyOn(bucketApi.util, 'invalidateTags');

    renderHook(() => useWebSocket(), { wrapper: wrapper(store) });
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0]!;
    socket.emitOpen();
    socket.emitMessage(JSON.stringify({ event: 'area.deleted', payload: {}, timestamp: '' }));
    socket.emitMessage(JSON.stringify({ event: 'bucket.created', payload: {}, timestamp: '' }));

    await waitFor(() => expect(areaSpy).toHaveBeenCalledWith(['Area']));
    await waitFor(() => expect(bucketSpy).toHaveBeenCalledWith(['Bucket']));
  });

  it('invalidates the attachment list for the payload owner on attachment.created (AC1)', async () => {
    const store = createMockStore({ auth: { user, token: freshToken() } });
    const spy = vi.spyOn(attachmentApi.util, 'invalidateTags');

    renderHook(() => useWebSocket(), { wrapper: wrapper(store) });
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0]!;
    socket.emitOpen();
    socket.emitMessage(
      JSON.stringify({
        event: 'attachment.created',
        payload: { id: 'a1', ownerType: 'task', ownerId: 'task-9', fileName: 'x.pdf' },
        timestamp: '',
      })
    );

    await waitFor(() => expect(spy).toHaveBeenCalledWith([{ type: 'Attachment', id: 'task-9' }]));
  });

  it('invalidates the attachment list on attachment.deleted (AC2), scoped to the event owner (AC3)', async () => {
    const store = createMockStore({ auth: { user, token: freshToken() } });
    const spy = vi.spyOn(attachmentApi.util, 'invalidateTags');

    renderHook(() => useWebSocket(), { wrapper: wrapper(store) });
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0]!;
    socket.emitOpen();
    socket.emitMessage(
      JSON.stringify({
        event: 'attachment.deleted',
        payload: { id: 'a1', ownerType: 'task', ownerId: 'task-42' },
        timestamp: '',
      })
    );

    await waitFor(() => expect(spy).toHaveBeenCalledWith([{ type: 'Attachment', id: 'task-42' }]));
    // Only that owner — never a bare 'Attachment' or another owner's id.
    expect(spy).not.toHaveBeenCalledWith([{ type: 'Attachment', id: 'task-9' }]);
    expect(spy).not.toHaveBeenCalledWith(['Attachment']);
  });

  it('ignores an attachment event with a malformed payload (no ownerId)', async () => {
    const store = createMockStore({ auth: { user, token: freshToken() } });
    const spy = vi.spyOn(attachmentApi.util, 'invalidateTags');

    renderHook(() => useWebSocket(), { wrapper: wrapper(store) });
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0]!;
    socket.emitOpen();
    socket.emitMessage(JSON.stringify({ event: 'attachment.created', payload: {}, timestamp: '' }));

    // A tick to let any (erroneous) dispatch flush.
    await Promise.resolve();
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows the paused banner after the socket drops past the first retry', async () => {
    const store = createMockStore({ auth: { user, token: freshToken() } });
    const { result } = renderHook(() => useWebSocket(), { wrapper: wrapper(store) });

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    MockWebSocket.instances[0]!.emitOpen();
    expect(result.current.paused).toBe(false);

    // First drop schedules retry #0 (no banner yet); advance to the reconnect.
    MockWebSocket.instances[0]!.emitClose(1006);
    await vi.advanceTimersByTimeAsync(1_100);
    await waitFor(() => expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2));

    // Second drop is past the first retry → banner shows.
    MockWebSocket.instances[MockWebSocket.instances.length - 1]!.emitClose(1006);
    await waitFor(() => expect(result.current.paused).toBe(true));
  });

  it('does not open a socket when there is no user', async () => {
    const store = createMockStore({ auth: { user: null, token: null } });
    renderHook(() => useWebSocket(), { wrapper: wrapper(store) });
    await Promise.resolve();
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it('does not open a socket until a token exists (no eager on-load refresh)', async () => {
    // Logged-in user but no token yet (the reload state before SessionRestorer runs).
    const store = createMockStore({ auth: { user, token: null } });
    renderHook(() => useWebSocket(), { wrapper: wrapper(store) });
    await Promise.resolve();
    // The socket must wait for the token — it never refreshes to obtain one here.
    expect(MockWebSocket.instances).toHaveLength(0);
  });
});
