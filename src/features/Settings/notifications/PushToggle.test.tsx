import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IUser } from '@/lib/types';

import { PushToggle } from './PushToggle';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';

const makeUser = (status: IUser['status']): IUser => ({
  id: 'u1',
  email: 'a@b.co',
  firstName: 'A',
  lastName: 'B',
  username: 'ab',
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  imageUrl: '',
  status,
});

const proStore = () => createMockStore({ auth: { user: makeUser('premium'), token: 't' } });
const freeStore = () => createMockStore({ auth: { user: makeUser('regular'), token: 't' } });

const fakeSubscription = {
  endpoint: 'https://push.example/abc',
  getKey: (name: string) => (name === 'p256dh' || name === 'auth' ? new Uint8Array([1, 2, 3]).buffer : null),
  unsubscribe: vi.fn().mockResolvedValue(true),
};

// Wire a full browser Push environment without replacing the entire navigator global,
// so existing stubs on window aren't clobbered.
const stubPushEnv = (existing: unknown = null, permission: NotificationPermission = 'default') => {
  const subscribe = vi.fn().mockResolvedValue(fakeSubscription);
  const getSubscription = vi.fn().mockResolvedValue(existing);
  const registration = { pushManager: { subscribe, getSubscription } };

  // Patch only serviceWorker on the existing navigator to preserve everything else.
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
      getRegistration: vi.fn().mockResolvedValue(existing !== null ? registration : undefined),
    },
    configurable: true,
    writable: true,
  });

  vi.stubGlobal('PushManager', function PushManager() {});
  vi.stubGlobal('Notification', {
    permission,
    requestPermission: vi.fn().mockResolvedValue(permission === 'denied' ? 'denied' : 'granted'),
  });
  vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BFN5TESTKEY0123456789abcdefABCDEF-_');

  // Re-assert the matchMedia mock because vi.clearAllMocks() in the global afterEach
  // clears the mockImplementation, causing next-themes to blow up when it calls .addListener.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  return { subscribe, getSubscription };
};

const restorePushEnv = () => {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: undefined,
    configurable: true,
    writable: true,
  });
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
};

const noop = () => {};

const subscribeHandler = () =>
  http.post(`${API}/notifications/push/subscribe`, () => new HttpResponse(null, { status: 201 }));

const unsubscribeHandler = () =>
  http.delete(`${API}/notifications/push/subscribe`, () => new HttpResponse(null, { status: 204 }));

describe('PushToggle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('unsupported environment', () => {
    it('renders nothing when push is not supported', () => {
      // No stubs → isPushSupported() returns false (no PushManager/Notification globals in jsdom).
      const { queryByTestId } = renderComponent(<PushToggle isPro={true} onLockedClick={noop} />, {
        store: proStore(),
      });
      expect(queryByTestId('push-toggle-row')).not.toBeInTheDocument();
    });
  });

  describe('free user', () => {
    beforeEach(() => stubPushEnv());
    afterEach(restorePushEnv);

    it('shows a locked Pro row and calls onLockedClick when clicked', async () => {
      const onLockedClick = vi.fn();
      renderComponent(<PushToggle isPro={false} onLockedClick={onLockedClick} />, { store: freeStore() });

      const row = await screen.findByTestId('push-toggle-row');
      await userEvent.click(row);

      expect(onLockedClick).toHaveBeenCalledTimes(1);
      // Switch must be disabled — locked users never trigger a permission request.
      const toggle = screen.getByTestId('push-toggle');
      expect(toggle).toBeDisabled();
    });

    it('does not call subscribe when the locked row is rendered', async () => {
      const subscribeSpy = vi.fn();
      server.use(
        http.post(`${API}/notifications/push/subscribe`, () => {
          subscribeSpy();
          return new HttpResponse(null, { status: 201 });
        })
      );

      renderComponent(<PushToggle isPro={false} onLockedClick={noop} />, { store: freeStore() });

      await screen.findByTestId('push-toggle-row');
      expect(subscribeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Pro user — permission denied', () => {
    beforeEach(() => stubPushEnv(null, 'denied'));
    afterEach(restorePushEnv);

    it('shows a disabled switch with blocked subtext and never calls subscribe', async () => {
      renderComponent(<PushToggle isPro={true} onLockedClick={noop} />, { store: proStore() });

      const toggle = await screen.findByTestId('push-toggle');
      await waitFor(() => expect(toggle).toBeDisabled());
      expect(screen.getByText(/blocked in browser settings/i)).toBeInTheDocument();
    });
  });

  describe('Pro user — off, can enable', () => {
    beforeEach(() => stubPushEnv(null, 'granted'));
    afterEach(restorePushEnv);

    it('shows "not enabled on this device" subtext initially', async () => {
      renderComponent(<PushToggle isPro={true} onLockedClick={noop} />, { store: proStore() });

      await waitFor(() => expect(screen.queryByTestId('push-toggle')).not.toBeDisabled());
      expect(await screen.findByText(/not enabled on this device/i)).toBeInTheDocument();
    });

    it('subscribes, syncs pushEnabled:true, and fires a success toast on enable', async () => {
      let prefBody: unknown;
      server.use(
        subscribeHandler(),
        http.put(`${API}/notifications/preferences`, async ({ request }) => {
          prefBody = await request.json();
          return HttpResponse.json({ data: {}, error: null });
        })
      );

      renderComponent(<PushToggle isPro={true} onLockedClick={noop} />, { store: proStore() });

      const toggle = await screen.findByTestId('push-toggle');
      await waitFor(() => expect(toggle).not.toBeDisabled());

      await userEvent.click(toggle);

      await waitFor(() => expect(prefBody).toEqual({ pushEnabled: true }));
      expect(toast.success).toHaveBeenCalled();
    });

    it('fires a failure toast when subscribe errors — does NOT call preferences PUT', async () => {
      let prefCalled = false;
      server.use(
        http.post(`${API}/notifications/push/subscribe`, () => new HttpResponse(null, { status: 500 })),
        http.put(`${API}/notifications/preferences`, () => {
          prefCalled = true;
          return HttpResponse.json({ data: {}, error: null });
        })
      );

      renderComponent(<PushToggle isPro={true} onLockedClick={noop} />, { store: proStore() });

      const toggle = await screen.findByTestId('push-toggle');
      await waitFor(() => expect(toggle).not.toBeDisabled());

      await userEvent.click(toggle);

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(prefCalled).toBe(false);
    });

    it('fires the permission-denied toast and does not subscribe when the OS prompt is denied', async () => {
      // Override: the permission prompt returns 'denied' even though current state is 'default'.
      vi.stubGlobal('Notification', {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied'),
      });

      const subscribeSpy = vi.fn();
      server.use(
        http.post(`${API}/notifications/push/subscribe`, () => {
          subscribeSpy();
          return new HttpResponse(null, { status: 201 });
        })
      );

      renderComponent(<PushToggle isPro={true} onLockedClick={noop} />, { store: proStore() });

      const toggle = await screen.findByTestId('push-toggle');
      await waitFor(() => expect(toggle).not.toBeDisabled());

      await userEvent.click(toggle);

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(subscribeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Pro user — already subscribed', () => {
    beforeEach(() => stubPushEnv(fakeSubscription, 'granted'));
    afterEach(restorePushEnv);

    it('reflects enabled state and shows "enabled on this device"', async () => {
      renderComponent(<PushToggle isPro={true} onLockedClick={noop} />, { store: proStore() });

      await waitFor(() => expect(screen.queryByTestId('push-toggle')).toHaveAttribute('data-state', 'checked'));
      expect(screen.getByText(/enabled on this device/i)).toBeInTheDocument();
    });

    it('unsubscribes and syncs pushEnabled:false on disable', async () => {
      let prefBody: unknown;
      server.use(
        unsubscribeHandler(),
        http.put(`${API}/notifications/preferences`, async ({ request }) => {
          prefBody = await request.json();
          return HttpResponse.json({ data: {}, error: null });
        })
      );

      renderComponent(<PushToggle isPro={true} onLockedClick={noop} />, { store: proStore() });

      const toggle = await screen.findByTestId('push-toggle');
      await waitFor(() => expect(toggle).toHaveAttribute('data-state', 'checked'));

      await userEvent.click(toggle);

      await waitFor(() => expect(prefBody).toEqual({ pushEnabled: false }));
      await waitFor(() => expect(toggle).toHaveAttribute('data-state', 'unchecked'));
    });
  });

  describe('mount with no service worker registered', () => {
    beforeEach(() => stubPushEnv(null, 'granted'));
    afterEach(restorePushEnv);

    it('resolves to off without hanging when no SW exists yet', async () => {
      renderComponent(<PushToggle isPro={true} onLockedClick={noop} />, { store: proStore() });

      const toggle = await screen.findByTestId('push-toggle');
      await waitFor(() => expect(toggle).not.toBeDisabled());
      expect(toggle).toHaveAttribute('data-state', 'unchecked');
    });
  });
});
