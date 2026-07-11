import { server } from '__tests__/server';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import authReducer from './auth/authSlice';
import rateLimitReducer from './rateLimit/rateLimitSlice';
import { taskApi } from './tasks/taskApi';

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
