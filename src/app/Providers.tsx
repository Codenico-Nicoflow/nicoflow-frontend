import React from 'react';

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { LoadingOverlayProvider, ThemeProvider, Toaster } from '@/components';
import { store, useAppUser, useGetCurrentUserQuery } from '@/lib/store';

const SessionRestorer = () => {
  const user = useAppUser();
  const hasToken = Boolean(localStorage.getItem('authToken'));
  useGetCurrentUserQuery(undefined, { skip: !!user || !hasToken });
  return null;
};

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="nicoflow-theme">
          <LoadingOverlayProvider>
            <SessionRestorer />
            {children}
            <Toaster />
          </LoadingOverlayProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};
