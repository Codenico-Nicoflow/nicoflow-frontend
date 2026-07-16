/* global self */
/* Nicoflow service worker — the tab-closed notification path (NIC-1590).
 *
 * The foreground path (useDesktopNotification) handles new arrivals while a tab is
 * open and focused. This worker covers the case that path can't: a push that lands
 * while every Nicoflow tab is closed or backgrounded. To avoid double-notifying, on
 * each push we check whether a focused Nicoflow client is already visible — if so
 * the foreground path is showing it, and we stay silent. A shared notification tag
 * also collapses any duplicate into one.
 */

const NOTIFICATION_TAG = 'nicoflow-notification';

// Activate immediately so an updated worker takes over without waiting for every
// tab to close — push handling should always be the latest logic.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  event.waitUntil(
    (async () => {
      const payload = readPayload(event.data);

      // If a focused Nicoflow tab is open, the in-app foreground path is already
      // notifying — suppress the OS notification to avoid a duplicate.
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const hasFocusedTab = clientList.some(client => client.focused && client.visibilityState === 'visible');
      if (hasFocusedTab) return;

      await self.registration.showNotification(payload.title, {
        body: payload.body,
        tag: NOTIFICATION_TAG, // collapse duplicates into one
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { type: payload.type },
      });
    })()
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Focus an existing Nicoflow tab if one is open; otherwise open the app.
      const existing = clientList.find(client => 'focus' in client);
      if (existing) {
        await existing.focus();
        return;
      }
      if (self.clients.openWindow) await self.clients.openWindow('/');
    })()
  );
});

// Push payloads are the JSON our backend sends ({ title, body, type }); fall back to
// generic copy if a payload is absent or unparseable so a notification still shows.
function readPayload(data) {
  const fallback = { title: 'Nicoflow', body: 'You have a new notification', type: '' };
  if (!data) return fallback;
  try {
    const parsed = data.json();
    return {
      title: typeof parsed.title === 'string' ? parsed.title : fallback.title,
      body: typeof parsed.body === 'string' ? parsed.body : fallback.body,
      type: typeof parsed.type === 'string' ? parsed.type : '',
    };
  } catch {
    return fallback;
  }
}
