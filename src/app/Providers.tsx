import React from 'react';

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { LoadingOverlayProvider, ThemeProvider, Toaster } from '@/components';
import { persistor, store, useAppDispatch, useAppUser, useRefreshTokenMutation } from '@/lib/store';
import { clearAuth, setToken } from '@/lib/store/slices/auth/authSlice';

const SessionRestorer = () => {
  const user = useAppUser();
  const dispatch = useAppDispatch();
  const [refreshToken] = useRefreshTokenMutation();

  React.useEffect(() => {
    if (!user) return;
    refreshToken()
      .unwrap()
      .then(data => {
        dispatch(setToken(data.token));
      })
      .catch(() => {
        dispatch(clearAuth());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div />} persistor={persistor}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="system" storageKey="nicoflow-theme">
            <LoadingOverlayProvider>
              <SessionRestorer />
              {children}
              <Toaster />
            </LoadingOverlayProvider>
          </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
};
