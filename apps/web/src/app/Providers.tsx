import { Provider } from 'react-redux';
import { store, persistor } from '@my-monorepo/store';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            {children}
            <Toaster />
          </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
};
