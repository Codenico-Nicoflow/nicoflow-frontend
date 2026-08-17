import { describe, expect, it, vi } from 'vitest';

import { clearAuth, setToken } from './auth/authSlice';
import { createWebTokenStorage } from './tokenStorage';

describe('createWebTokenStorage', () => {
  it('getAccessToken reads the token off the auth slice', () => {
    const getState = vi.fn(() => ({ auth: { token: 'abc123' } }));
    const storage = createWebTokenStorage(getState, vi.fn());

    expect(storage.getAccessToken()).toBe('abc123');
    expect(getState).toHaveBeenCalledTimes(1);
  });

  it('getAccessToken returns null when the slice has no token', () => {
    const storage = createWebTokenStorage(() => ({ auth: { token: null } }), vi.fn());
    expect(storage.getAccessToken()).toBeNull();
  });

  it('setAccessToken dispatches setToken with the given value', () => {
    const dispatch = vi.fn();
    const storage = createWebTokenStorage(() => ({ auth: { token: null } }), dispatch);

    storage.setAccessToken('fresh-token');

    expect(dispatch).toHaveBeenCalledWith(setToken('fresh-token'));
  });

  it('setAccessToken dispatches setToken(null) to clear just the access token', () => {
    const dispatch = vi.fn();
    const storage = createWebTokenStorage(() => ({ auth: { token: 'x' } }), dispatch);

    storage.setAccessToken(null);

    expect(dispatch).toHaveBeenCalledWith(setToken(null));
  });

  it('getRefreshToken always resolves null — the browser owns the HttpOnly cookie', async () => {
    const storage = createWebTokenStorage(() => ({ auth: { token: null } }), vi.fn());
    await expect(storage.getRefreshToken()).resolves.toBeNull();
  });

  it('setRefreshToken is a no-op — nothing to store client-side', async () => {
    const dispatch = vi.fn();
    const storage = createWebTokenStorage(() => ({ auth: { token: null } }), dispatch);

    await storage.setRefreshToken('whatever');

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('clear dispatches clearAuth to wipe the whole auth slice', async () => {
    const dispatch = vi.fn();
    const storage = createWebTokenStorage(() => ({ auth: { token: 'x' } }), dispatch);

    await storage.clear();

    expect(dispatch).toHaveBeenCalledWith(clearAuth());
  });
});
