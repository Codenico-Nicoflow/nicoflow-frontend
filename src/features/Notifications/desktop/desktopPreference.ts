// Client-only enable preference for browser (OS) notifications. Persisted per-browser
// in localStorage — the OS notification is a local affordance, no backend field. A tiny
// subscribe/get/set store so the bell and the panel toggle share one source of truth
// and re-render together on change. Enabling is gated by the browser permission (handled
// in the hook); this flag only records the user's intent.
const STORAGE_KEY = 'nicoflow-desktop-notifications-enabled';

const listeners = new Set<() => void>();

const read = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false; // private mode / storage disabled → off
  }
};

export const isDesktopEnabled = (): boolean => read();

export const setDesktopEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Storage unavailable — the in-memory listeners still fire for this session.
  }
  listeners.forEach(fn => fn());
};

// useSyncExternalStore-compatible subscribe.
export const subscribeDesktopEnabled = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
