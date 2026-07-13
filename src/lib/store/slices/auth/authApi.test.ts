import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../../../__tests__/server';
import { areaApi } from '../area/areaApi';

import { authApi } from './authApi';
import authReducer from './authSlice';

const envelope = <T>(data: T) => ({ data, error: null });

// Minimal store wiring just the two APIs under test.
const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
      [areaApi.reducerPath]: areaApi.reducer,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(authApi.middleware, areaApi.middleware),
  });

describe('authApi logout — cache isolation', () => {
  it('resets the domain caches so a new user does not see the previous user’s data', async () => {
    server.use(
      http.get('http://localhost:8080/v1/areas', () =>
        HttpResponse.json(envelope({ items: [{ id: 'a1', name: 'User A area' }], nextCursor: '' }))
      ),
      http.post('http://localhost:8080/v1/auth/logout', () => HttpResponse.json(envelope(null)))
    );

    const store = makeStore();

    // User A's areas land in the areaApi cache.
    await store.dispatch(areaApi.endpoints.getAreas.initiate());
    expect(Object.keys(store.getState()[areaApi.reducerPath].queries)).toHaveLength(1);

    // Logging out must wipe that cache.
    await store.dispatch(authApi.endpoints.logout.initiate());
    expect(store.getState()[areaApi.reducerPath].queries).toEqual({});
  });
});
