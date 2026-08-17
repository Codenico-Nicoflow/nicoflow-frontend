import { server } from '__tests__/server';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { authApi, taskApi } from '../store';

import authReducer from './auth/authSlice';
import rateLimitReducer from './rateLimit/rateLimitSlice';

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

const API = 'http://localhost:8080/v1';

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, rateLimit: rateLimitReducer, [taskApi.reducerPath]: taskApi.reducer },
    middleware: gDM => gDM().concat(taskApi.middleware),
  });

describe('baseQueryWithReauth — rate limiting', () => {
  it('records a retry time and toasts once when a request is rate-limited', async () => {
    toastError.mockClear();
    server.use(
      http.get(`${API}/focus`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'RATE_LIMITED', message: 'too many requests, slow down' } },
          { status: 429, headers: { 'Retry-After': '12' } }
        )
      )
    );

    const store = makeStore();
    const before = Date.now();
    await store.dispatch(taskApi.endpoints.getFocus.initiate({ available: 30, energy: 'low', limit: 5 }));

    const retryAt = store.getState().rateLimit.retryAt;
    expect(retryAt).not.toBeNull();
    // Retry-After: 12s → retryAt ~12s out.
    expect(retryAt).toBeGreaterThanOrEqual(before + 11_000);
    expect(retryAt).toBeLessThanOrEqual(before + 13_000);
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it('falls back to a default wait when Retry-After is absent', async () => {
    toastError.mockClear();
    server.use(
      http.get(`${API}/focus`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'RATE_LIMITED', message: 'too many requests' } },
          { status: 429 }
        )
      )
    );

    const store = makeStore();
    const before = Date.now();
    await store.dispatch(taskApi.endpoints.getFocus.initiate({ available: 30, energy: 'low', limit: 5 }));

    const retryAt = store.getState().rateLimit.retryAt;
    expect(retryAt).toBeGreaterThanOrEqual(before + 25_000);
  });
});

describe('baseQueryWithReauth — pre-session 401s skip the refresh flow', () => {
  const makeAuthStore = () =>
    configureStore({
      reducer: { auth: authReducer, rateLimit: rateLimitReducer, [authApi.reducerPath]: authApi.reducer },
      middleware: gDM => gDM().concat(authApi.middleware),
    });

  it('does not fire a /refresh-token when login returns 401 (bad credentials)', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'UNAUTHORIZED', message: 'invalid credentials' } },
          { status: 401 }
        )
      ),
      http.post(`${API}/auth/refresh-token`, () => {
        refreshCalls += 1;
        return HttpResponse.json(
          { data: null, error: { code: 'UNAUTHORIZED', message: 'no session' } },
          { status: 401 }
        );
      })
    );

    const store = makeAuthStore();
    const result = await store.dispatch(
      authApi.endpoints.login.initiate({ identifier: 'a@b.com', password: 'wrong', remember: false })
    );

    expect('error' in result).toBe(true);
    expect(refreshCalls).toBe(0);
  });
});
