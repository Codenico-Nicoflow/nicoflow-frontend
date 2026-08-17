import type { TokenStorage } from '@nicoflow/shared/api/adapters';
import type { UnknownAction } from '@reduxjs/toolkit';

import { clearAuth, setToken } from './auth/authSlice';

// Web's TokenStorage: the access token lives in the Redux `auth` slice
// (memory-only, never localStorage — XSS safety); the refresh token is an
// HttpOnly cookie the browser attaches automatically, so this side is
// genuinely a no-op — there is no refresh-token *value* ever visible to JS to
// store. dispatch/getState are structurally typed (not AppDispatch/RootState,
// and not Redux's own generic Dispatch<T> — nothing here reads a dispatch
// return value) and late-bound: this module is constructed inside store.ts
// before configureStore() returns, so it must read the store lazily, and
// importing store.ts's own derived types here would be circular.
export const createWebTokenStorage = (
  getState: () => { auth: { token: string | null } },
  dispatch: (action: UnknownAction) => void
): TokenStorage => ({
  getAccessToken: () => getState().auth.token,
  setAccessToken: token => {
    dispatch(setToken(token));
  },
  getRefreshToken: async () => null,
  setRefreshToken: async () => {},
  clear: async () => {
    dispatch(clearAuth());
  },
});
