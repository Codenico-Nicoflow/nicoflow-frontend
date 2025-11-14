import React from 'react';

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { LoadingOverlayProvider } from '@/components/loading-overlay/LoadingOverlayProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { store } from '@/lib/store';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <LoadingOverlayProvider>
            {children}
            <Toaster />
          </LoadingOverlayProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};
