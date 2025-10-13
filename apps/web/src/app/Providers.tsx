import React from 'react';

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { store } from '@my-monorepo/store';

import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};
