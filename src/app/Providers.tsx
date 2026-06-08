import React from 'react';

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { LoadingOverlayProvider, ThemeProvider, Toaster } from '@/components';
import { persistor, store, useAppDispatch, useAppUser, useRefreshTokenMutation } from '@/lib/store';
import { clearAuth, setToken, setUser } from '@/lib/store/slices/auth/authSlice';
import { getApiErrorCode } from '@/lib/utils';

// Error codes that mean the session is genuinely invalid (refresh token expired,
// revoked, or rejected). Only these should log the user out on reload — a network
// blip or a 5xx must NOT nuke a persisted session.
const DEFINITIVE_AUTH_FAILURES = new Set(['INVALID_TOKEN', 'UNAUTHORIZED', 'INVALID_REFRESH_TOKEN']);

// SessionRestorer refreshes the access token on app load when a persisted user
// exists. It trusts the persisted session while the refresh is in flight (so a
// reload doesn't flash the user to /sign-in) and only clears auth when the
// refresh fails with a definitive auth error.
const SessionRestorer = ({ children }: { children: React.ReactNode }) => {
  const user = useAppUser();
  const dispatch = useAppDispatch();
  const [refreshToken] = useRefreshTokenMutation();
  // Only block on restore when there's actually a persisted session to restore.
  const [isRestoring, setIsRestoring] = React.useState(() => Boolean(user));

  React.useEffect(() => {
    if (!user) {
      setIsRestoring(false);
      return;
    }
    let active = true;
    refreshToken()
      .unwrap()
      .then(data => {
        if (!active) return;
        dispatch(setToken(data.token));
        if (data.user) dispatch(setUser(data.user));
      })
      .catch(error => {
        if (!active) return;
        // Definitive auth failure → session is dead, log out. Transient failure
        // (network/5xx) → keep the persisted session; the next 401 will refresh.
        if (DEFINITIVE_AUTH_FAILURES.has(getApiErrorCode(error) ?? '')) {
          dispatch(clearAuth());
        }
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isRestoring) {
    return <div />;
  }
  return <>{children}</>;
};

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div />} persistor={persistor}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="system" storageKey="nicoflow-theme">
            <LoadingOverlayProvider>
              <SessionRestorer>{children}</SessionRestorer>
              <Toaster />
            </LoadingOverlayProvider>
          </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
};
