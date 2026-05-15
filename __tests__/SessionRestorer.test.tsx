import React from 'react';

import { render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useAppDispatch, useAppUser, useRefreshTokenMutation } from '@/lib/store';
import { clearAuth, setToken } from '@/lib/store/slices/auth/authSlice';
import { mockAuthResponse, mockUser } from '@/mocks/handlers';

import { createMockStore } from './renderComponent';
import { server } from './server';

// Inline SessionRestorer — mirrors src/app/Providers.tsx exactly
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
  }, []);

  return null;
};

const renderWithStore = (store: ReturnType<typeof createMockStore>) => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <SessionRestorer />
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

  it('clears auth when refresh-token returns 401 (expired cookie)', async () => {
    server.use(
      http.post('http://localhost:8080/v1/auth/refresh-token', () =>
        HttpResponse.json({ code: 'INVALID_TOKEN', message: 'invalid or expired token' }, { status: 401 })
      )
    );

    const store = createMockStore({ auth: { user: mockUser, token: null, isLoading: false } });
    renderWithStore(store);

    await waitFor(() => {
      expect(store.getState().auth.user).toBeNull();
      expect(store.getState().auth.token).toBeNull();
    });
  });
});
