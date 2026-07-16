import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockStore } from '../../../../__tests__/renderComponent';
import { server } from '../../../../__tests__/server';

import { usePushSubscription } from './usePushSubscription';

const API = 'http://localhost:8080/v1';

const baseUser = {
  id: 'u1',
  email: 'a@b.co',
  firstName: 'A',
  lastName: 'B',
  username: 'ab',
  theme: 'light' as const,
  language: 'en' as const,
  imageUrl: '',
};

const proUser = { ...baseUser, status: 'premium' as const };
const freeUser = { ...baseUser, status: 'regular' as const };

const wrapper =
  (store: ReturnType<typeof createMockStore>) =>
  ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

// Wire up a browser Push environment: a service worker whose PushManager subscribes
// to a fake PushSubscription carrying the two required keys.
const fakeSubscription = {
  endpoint: 'https://push.example/abc',
  getKey: (name: string) => (name === 'p256dh' || name === 'auth' ? new Uint8Array([1, 2, 3]).buffer : null),
  unsubscribe: vi.fn().mockResolvedValue(true),
};

const stubPushEnv = (existing: unknown = null, hasRegistration = existing !== null) => {
  const subscribe = vi.fn().mockResolvedValue(fakeSubscription);
  const getSubscription = vi.fn().mockResolvedValue(existing);
  const registration = { pushManager: { subscribe, getSubscription } };
  vi.stubGlobal('navigator', {
    userAgent: 'test-agent',
    serviceWorker: {
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
      // Mount reflects state via getRegistration (immediate) — undefined when the
      // worker was never registered (the lazy-register case).
      getRegistration: vi.fn().mockResolvedValue(hasRegistration ? registration : undefined),
    },
  });
  vi.stubGlobal('PushManager', function PushManager() {});
  vi.stubGlobal('Notification', {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  });
  // A valid base64url string so applicationServerKey conversion (atob) doesn't throw.
  vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BFN5TESTKEY0123456789abcdefABCDEF-_');
  return { subscribe, getSubscription };
};

describe('usePushSubscription', () => {
  beforeEach(() => stubPushEnv());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('AC1 — a Pro user subscribes and the subscription is POSTed', async () => {
    let posted: unknown = null;
    server.use(
      http.post(`${API}/notifications/push/subscribe`, async ({ request }) => {
        posted = await request.json();
        return new HttpResponse(null, { status: 201 });
      })
    );
    const store = createMockStore({ auth: { user: proUser, token: 't' } });
    const { result } = renderHook(() => usePushSubscription(), { wrapper: wrapper(store) });

    await waitFor(() => expect(result.current.busy).toBe(false));
    const outcome = await result.current.enable();

    expect(outcome).toBe('subscribed');
    await waitFor(() => expect(posted).not.toBeNull());
    expect(posted).toMatchObject({ endpoint: 'https://push.example/abc', userAgent: 'test-agent' });
  });

  it('mount stays usable when no service worker is registered yet (no ready hang)', async () => {
    // stubPushEnv() → getRegistration resolves undefined; the toggle must not hang busy.
    const store = createMockStore({ auth: { user: proUser, token: 't' } });
    const { result } = renderHook(() => usePushSubscription(), { wrapper: wrapper(store) });

    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.enabled).toBe(false);
    expect(result.current.supported).toBe(true);
  });

  it('AC2 — a free user is not subscribed and gets needs-upgrade', async () => {
    const postSpy = vi.fn();
    server.use(
      http.post(`${API}/notifications/push/subscribe`, () => {
        postSpy();
        return new HttpResponse(null, { status: 201 });
      })
    );
    const store = createMockStore({ auth: { user: freeUser, token: 't' } });
    const { result } = renderHook(() => usePushSubscription(), { wrapper: wrapper(store) });

    await waitFor(() => expect(result.current.busy).toBe(false));
    const outcome = await result.current.enable();

    expect(outcome).toBe('needs-upgrade');
    expect(result.current.enabled).toBe(false);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('unsubscribe removes the local subscription and DELETEs it', async () => {
    stubPushEnv(fakeSubscription); // an active subscription exists
    let deleted: unknown = null;
    server.use(
      http.delete(`${API}/notifications/push/subscribe`, async ({ request }) => {
        deleted = await request.json();
        return new HttpResponse(null, { status: 204 });
      })
    );
    const store = createMockStore({ auth: { user: proUser, token: 't' } });
    const { result } = renderHook(() => usePushSubscription(), { wrapper: wrapper(store) });

    // Mount effect sees the existing subscription → enabled true, before we disable.
    await waitFor(() => expect(result.current.enabled).toBe(true));
    await result.current.disable();

    expect(fakeSubscription.unsubscribe).toHaveBeenCalled();
    await waitFor(() => expect(deleted).toMatchObject({ endpoint: 'https://push.example/abc' }));
    await waitFor(() => expect(result.current.enabled).toBe(false));
  });
});
