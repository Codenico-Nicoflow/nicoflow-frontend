import { useCallback, useSyncExternalStore } from 'react';

import { isDesktopEnabled, setDesktopEnabled, subscribeDesktopEnabled } from './desktopPreference';

// Browser (OS) notifications for new arrivals — the replacement for the old chime.
// Fires on every genuine new arrival (count rise), regardless of tab focus, so the
// user is pulled back to the app. Self-guards on the enable preference and the
// browser permission; a no-op when either is missing (SSR, unsupported, denied).

const supported = (): boolean => typeof window !== 'undefined' && 'Notification' in window;

// Subscribes a component to the enable preference so its UI reflects the current state.
export const useDesktopEnabled = (): boolean =>
  useSyncExternalStore(subscribeDesktopEnabled, isDesktopEnabled, () => false);

// Turns the preference on/off. Enabling requests OS permission first: only persist
// "enabled" if the user actually granted it, so the toggle never claims a state the
// browser won't honour. Returns the resulting enabled state.
export const enableDesktopNotifications = async (next: boolean): Promise<boolean> => {
  if (!next) {
    setDesktopEnabled(false);
    return false;
  }
  if (!supported()) return false;

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  const granted = permission === 'granted';
  setDesktopEnabled(granted);
  return granted;
};

// Returns a stable notify(title, body) that shows an OS notification when enabled and
// permitted. Silent otherwise. Focuses the tab on click so the user lands in the app.
export const useDesktopNotification = () =>
  useCallback((title: string, body: string) => {
    if (!isDesktopEnabled()) return;
    if (!supported() || Notification.permission !== 'granted') return;

    const notification = new Notification(title, { body, tag: 'nicoflow-notification' });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, []);
