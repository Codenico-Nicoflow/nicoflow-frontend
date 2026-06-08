import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useAppDispatch, useAppUser, useRefreshTokenMutation } from '@/lib/store';
import { clearAuth, setToken, setUser } from '@/lib/store/slices/auth/authSlice';
import { getApiErrorCode } from '@/lib/utils';
import { mockAuthResponse, mockUser } from '@/mocks/handlers';

import { createMockStore } from './renderComponent';
import { server } from './server';

// Inline SessionRestorer — mirrors src/app/Providers.tsx exactly.
const DEFINITIVE_AUTH_FAILURES = new Set(['INVALID_TOKEN', 'UNAUTHORIZED', 'INVALID_REFRESH_TOKEN']);

const SessionRestorer = ({ children }: { children?: React.ReactNode }) => {
  const user = useAppUser();
  const dispatch = useAppDispatch();
  const [refreshToken] = useRefreshTokenMutation();
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
  }, []);

  if (isRestoring) return <div data-testid="restoring" />;
  return <>{children}</>;
};

const renderWithStore = (store: ReturnType<typeof createMockStore>) => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <SessionRestorer>
          <div data-testid="app" />
        </SessionRestorer>
      </BrowserRouter>
    </Provider>
  );
  return store;
};

describe('SessionRestorer', () => {
  it('does NOT call refresh-token when there is no persisted user', async () => {
    let refreshCalled = false;
    server.use(
      http.post('http://localhost:8080/v1/auth/refresh-token', () => {
        refreshCalled = true;
        return HttpResponse.json({ data: mockAuthResponse, error: null });
      })
    );

    const store = createMockStore({ auth: { user: null, token: null, isLoading: false } });
    renderWithStore(store);

    // Give any async effects time to fire
    await new Promise(r => setTimeout(r, 50));
    expect(refreshCalled).toBe(false);
  });

  it('calls refresh-token and stores new token when user is persisted', async () => {
    const store = createMockStore({ auth: { user: mockUser, token: null, isLoading: false } });
    renderWithStore(store);

    await waitFor(() => {
      expect(store.getState().auth.token).toBe('new-mock-access-token');
    });
    // User should remain set
    expect(store.getState().auth.user).toEqual(mockUser);
  });

  it('clears auth when refresh-token returns a definitive auth failure (expired cookie)', async () => {
    server.use(
      http.post('http://localhost:8080/v1/auth/refresh-token', () =>
        HttpResponse.json(
          { data: null, error: { code: 'INVALID_TOKEN', message: 'invalid or expired token' } },
          { status: 401 }
        )
      )
    );

    const store = createMockStore({ auth: { user: mockUser, token: null, isLoading: false } });
    renderWithStore(store);

    await waitFor(() => {
      expect(store.getState().auth.user).toBeNull();
      expect(store.getState().auth.token).toBeNull();
    });
  });

  // The reload-logout bug: a transient failure (network error / 5xx) must NOT
  // log the user out. The persisted session is trusted; the next 401 will refresh.
  it('keeps the persisted session when refresh-token fails transiently (5xx)', async () => {
    const persistedToken = 'persisted-access-token';
    server.use(
      http.post('http://localhost:8080/v1/auth/refresh-token', () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom' } }, { status: 500 })
      )
    );

    const store = createMockStore({ auth: { user: mockUser, token: persistedToken, isLoading: false } });
    renderWithStore(store);

    // App renders (not blocked), user + token survive the failed refresh.
    await waitFor(() => {
      expect(screen.getByTestId('app')).toBeInTheDocument();
    });
    expect(store.getState().auth.user).toEqual(mockUser);
    expect(store.getState().auth.token).toBe(persistedToken);
  });

  it('renders the app immediately when there is no persisted user (no restore gate)', async () => {
    const store = createMockStore({ auth: { user: null, token: null, isLoading: false } });
    renderWithStore(store);
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });
});
