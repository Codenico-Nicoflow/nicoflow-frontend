import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import { makeUser } from '@/mocks/handlers';
import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import { PushToggle } from './PushToggle';

const API = 'http://localhost:8080/v1';

// Fake subscription used by the "On" story.
const fakeSubscription = {
  endpoint: 'https://push.example/abc',
  getKey: (name: string) => (name === 'p256dh' || name === 'auth' ? new Uint8Array([1, 2, 3]).buffer : null),
  unsubscribe: () => Promise.resolve(true),
};

// Inject a full browser Push environment so isPushSupported() returns true.
// Each story that needs it declares this as a decorator. Stories that intentionally
// need push to be unsupported simply don't include it.
const withPushSupport =
  (existing: typeof fakeSubscription | null = null, permission: NotificationPermission = 'default'): Decorator =>
  Story => {
    const subscribe = () => Promise.resolve(fakeSubscription);
    const getSubscription = () => Promise.resolve(existing);
    const registration = { pushManager: { subscribe, getSubscription } };

    Object.defineProperty(window, 'PushManager', { value: function PushManager() {}, configurable: true });
    Object.defineProperty(window, 'Notification', {
      value: {
        permission,
        requestPermission: () => Promise.resolve(permission === 'denied' ? 'denied' : 'granted'),
      },
      configurable: true,
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: () => Promise.resolve(registration),
        ready: Promise.resolve(registration),
        getRegistration: () => Promise.resolve(existing !== null ? registration : undefined),
      },
      configurable: true,
    });
    // Provide a valid VAPID key so the isPushSupported key check passes.
    // Storybook's import.meta.env isn't stubable the same way Vitest's is; we set
    // the env key directly on the vite-injected object at module init time instead.
    (import.meta.env as Record<string, string>)['VITE_VAPID_PUBLIC_KEY'] = 'BFN5TESTKEY0123456789abcdefABCDEF-_';

    return <Story />;
  };

const prefsOkHandler = () =>
  http.put(`${API}/notifications/preferences`, () => HttpResponse.json({ data: {}, error: null }));

const subscribeOkHandler = () =>
  http.post(`${API}/notifications/push/subscribe`, () => new HttpResponse(null, { status: 201 }));

const unsubscribeOkHandler = () =>
  http.delete(`${API}/notifications/push/subscribe`, () => new HttpResponse(null, { status: 204 }));

const meta: Meta<typeof PushToggle> = {
  title: 'Features/Settings/PushToggle',
  component: PushToggle,
  decorators: [
    withStoryProviders,
    Story => (
      <div className="mx-auto max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    onLockedClick: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PushToggle>;

// Free user: row is locked with a Pro pill; clicking calls onLockedClick.
export const LockedFree: Story = {
  decorators: [withPushSupport(null, 'default')],
  args: { isPro: false },
  parameters: {
    preloadedState: { auth: { user: makeUser({ status: 'regular' }), token: 't', isLoading: false } },
    msw: { handlers: [prefsOkHandler()] },
  },
};

// Pro user, browser permission has been denied. Switch is visible but disabled.
export const PermissionDenied: Story = {
  decorators: [withPushSupport(null, 'denied')],
  args: { isPro: true },
  parameters: {
    preloadedState: { auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } },
    msw: { handlers: [prefsOkHandler()] },
  },
};

// Pro user, permission granted, no active subscription. Ready to enable.
export const OffCanEnable: Story = {
  decorators: [withPushSupport(null, 'granted')],
  args: { isPro: true },
  parameters: {
    preloadedState: { auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } },
    msw: { handlers: [subscribeOkHandler(), prefsOkHandler()] },
  },
};

// Pro user with an active subscription. Switch is on.
export const On: Story = {
  decorators: [withPushSupport(fakeSubscription, 'granted')],
  args: { isPro: true },
  parameters: {
    preloadedState: { auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } },
    msw: { handlers: [unsubscribeOkHandler(), prefsOkHandler()] },
  },
};

// Pro user mid-enable: switch shows optimistic-on while the subscribe request is in flight.
export const Enabling: Story = {
  decorators: [withPushSupport(null, 'granted')],
  args: { isPro: true },
  parameters: {
    preloadedState: { auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } },
    msw: {
      handlers: [
        // Never resolves — freezes the component in the enabling state.
        http.post(`${API}/notifications/push/subscribe`, () => new Promise(() => {})),
        prefsOkHandler(),
      ],
    },
  },
};

// Unsupported: the component returns null, so this story is intentionally left as a
// comment-only placeholder — rendering it would produce an empty canvas, which is
// accurate but confusing. Add it if a "null renders nothing" demo is ever needed.
// export const Unsupported: Story = { ... };
