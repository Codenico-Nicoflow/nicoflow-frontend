// Platform seam for auth token storage and app-lifecycle signals. Web keeps
// its access token in memory (Redux) with refresh via an HttpOnly cookie the
// browser manages; a future React Native app has no cookie jar and needs
// expo-secure-store instead. Neither this file nor any RTK Query slice may
// hardcode either model — every platform constructs its own implementation
// and injects it at store/connection setup (web: src/lib/store/store.ts).

// getAccessToken/setAccessToken are synchronous: the access token lives in
// memory on every platform (Redux on web), so there's never an async read on
// the hot path of attaching an Authorization header. The refresh token is
// async because a platform's secure storage (expo-secure-store, an HttpOnly
// cookie) may not be synchronously readable.
export interface TokenStorage {
  getAccessToken(): string | null;
  setAccessToken(token: string | null): void;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string | null): Promise<void>;
  clear(): Promise<void>;
}

// Foreground/background signal, abstracted over web's document.visibilitychange
// and RN's AppState. onForeground/onBackground return an unsubscribe function
// (the same shape as a DOM event listener's cleanup), so callers can register
// and tear down without knowing which platform they're on.
export interface WSLifecycleAdapter {
  onForeground(cb: () => void): () => void;
  onBackground(cb: () => void): () => void;
  isForeground(): boolean;
}
