// Client-only mute preference for the notification chime. Persisted per-browser in
// localStorage (no backend field — the sound is a local affordance). A tiny
// subscribe/get/set store so the bell and the panel toggle share one source of
// truth and re-render together on change.
const STORAGE_KEY = 'nicoflow-notification-sound-muted';

const listeners = new Set<() => void>();

const read = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false; // private mode / storage disabled → sound on
  }
};

export const isSoundMuted = (): boolean => read();

export const setSoundMuted = (muted: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // Storage unavailable — the in-memory listeners still fire for this session.
  }
  listeners.forEach(fn => fn());
};

// useSyncExternalStore-compatible subscribe.
export const subscribeSoundMuted = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
