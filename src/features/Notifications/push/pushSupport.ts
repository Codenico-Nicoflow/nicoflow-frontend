// Low-level Web Push plumbing: capability detection, VAPID key conversion, service
// worker registration, and the PushManager subscribe/unsubscribe calls. Kept free of
// React + RTK so it stays unit-testable and (post-E-033) reusable from the shared pkg.

// Read lazily (not a module const) so a test can stub the env and so a build-time
// swap of the key is picked up without a module-cache surprise.
const vapidPublicKey = (): string | undefined => import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Web Push needs a service worker + PushManager + Notification, plus a configured
// VAPID key. Missing any ⇒ the tab-closed path is unavailable (the foreground path
// still works). This is the single gate the UI checks before offering the toggle.
export const isPushSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' &&
  'PushManager' in window &&
  'Notification' in window &&
  Boolean(vapidPublicKey());

// applicationServerKey must be a Uint8Array; the VAPID public key is base64url text.
// Decode it once (pad, url→std alphabet, atob → bytes).
const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

// Register the worker (served from the site root) and wait until it's ready to
// subscribe. Idempotent — the browser dedupes repeat registrations of the same URL.
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
};

// A PushSubscription flattened into our API's shape ({ endpoint, p256dhKey, authKey,
// userAgent }). Returns null if the subscription is missing a key (never expected,
// but keeps the caller total).
export const toSubscribePayload = (
  sub: PushSubscription
): { endpoint: string; p256dhKey: string; authKey: string; userAgent: string } | null => {
  const p256dh = sub.getKey('p256dh');
  const auth = sub.getKey('auth');
  if (!p256dh || !auth) return null;
  return {
    endpoint: sub.endpoint,
    p256dhKey: bufferToBase64Url(p256dh),
    authKey: bufferToBase64Url(auth),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
};

// Create (or reuse) the browser push subscription for our VAPID key.
export const createPushSubscription = async (registration: ServiceWorkerRegistration): Promise<PushSubscription> => {
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey() as string),
  });
};

// Tear down the local subscription; returns its endpoint so the caller can tell the
// backend which row to drop. Null when there was nothing subscribed.
export const removePushSubscription = async (): Promise<string | null> => {
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
};

const bufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
