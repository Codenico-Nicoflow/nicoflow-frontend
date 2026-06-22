import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { LoadingOverlayProvider, ThemeProvider, Toaster } from '@/components';
import { persistor, store } from '@/lib/store';

// Session handling: the access token is memory-only (not persisted) — on reload
// only the `user` rehydrates. We deliberately do NOT eagerly refresh the token
// on load. Instead the app renders, trusting the persisted user, and the first
// authed request that 401s triggers a single (mutex-guarded) refresh + retry in
// baseQuery. This is what prevents the reload-mash logout: rapid reloads no
// longer each fire /refresh-token and rotate the token out from under each other
// (which made the loser's now-consumed token 401 and bounce the user). The
// genuine "session is dead" path still logs out — baseQuery clears auth on a
// definitive INVALID_TOKEN/UNAUTHORIZED from the refresh.

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div />} persistor={persistor}>
        <BrowserRouter>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="nicoflow-theme">
            <LoadingOverlayProvider>
              {children}
              <Toaster />
            </LoadingOverlayProvider>
          </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
};
