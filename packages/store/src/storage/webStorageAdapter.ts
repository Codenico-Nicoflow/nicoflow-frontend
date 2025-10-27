import type { StorageAdapter } from './storageAdapter';

/**
 * Storage adapter for web platform
 *
 * NOTE: authToken operations are intentionally blocked because:
 * - Web uses httpOnly cookies for access tokens (backend manages them)
 * - The cookie is automatically sent with every request via credentials: 'include'
 * - This prevents XSS attacks as JavaScript cannot access httpOnly cookies
 * - Refresh tokens are also stored in httpOnly cookies
 *
 * For mobile (expoStorageAdapter), tokens ARE stored in SecureStore
 * and sent via Authorization header.
 */
export const webStorageAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    if (key === 'authToken') {
      return null;
    }
    return localStorage.getItem(key);
  },

  setItem: async (key: string, value: string) => {
    if (key === 'authToken') {
      return;
    }
    localStorage.setItem(key, value);
  },

  removeItem: async (key: string) => {
    if (key === 'authToken') {
      return;
    }
    localStorage.removeItem(key);
  },
};
