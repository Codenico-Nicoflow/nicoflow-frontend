import type { WSLifecycleAdapter } from '@nicoflow/shared/api/adapters';

// Web's WSLifecycleAdapter: the Page Visibility API is the browser's
// foreground/background signal (RN uses AppState instead — see
// @nicoflow/shared/api/adapters for the platform-agnostic interface).
// document.visibilitychange fires for both tab-switch and window
// minimize/restore, which is what "foreground" means for a WS connection —
// a backgrounded tab is still running JS but the user isn't looking at it.
export const createWebWSLifecycleAdapter = (): WSLifecycleAdapter => ({
  onForeground: cb => {
    const handler = () => {
      if (document.visibilityState === 'visible') cb();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  },
  onBackground: cb => {
    const handler = () => {
      if (document.visibilityState === 'hidden') cb();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  },
  isForeground: () => document.visibilityState === 'visible',
});
