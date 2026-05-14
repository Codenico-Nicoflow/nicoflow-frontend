import React from 'react';

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { LoadingOverlayProvider, ThemeProvider, Toaster } from '@/components';
import { store } from '@/lib/store';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="nicoflow-theme">
          <LoadingOverlayProvider>
            {children}
            <Toaster />
          </LoadingOverlayProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};
