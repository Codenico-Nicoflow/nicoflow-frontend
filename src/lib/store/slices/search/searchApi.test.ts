import { server } from '__tests__/server';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import authReducer from '../auth/authSlice';

import { searchApi } from './searchApi';

const API = 'http://localhost:8080/v1';

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, [searchApi.reducerPath]: searchApi.reducer },
    middleware: gDM => gDM().concat(searchApi.middleware),
  });

describe('searchApi slice', () => {
  it('sends q single-encoded (no double-encoding of the space) and unwraps the envelope', async () => {
    let seen: URLSearchParams | undefined;
    server.use(
      http.get(`${API}/search`, ({ request }) => {
        seen = new URL(request.url).searchParams;
        return HttpResponse.json({ data: { tasks: [], projects: [], areas: [] }, error: null });
      })
    );

    const store = makeStore();
    const res = await store.dispatch(searchApi.endpoints.search.initiate('qa area'));

    // Decoded param must be the literal query — a double-encode would yield "qa%20area".
    expect(seen?.get('q')).toBe('qa area');
    expect(seen?.get('types')).toBe('task,project,area');
    expect('data' in res ? res.data : undefined).toEqual({ tasks: [], projects: [], areas: [] });
  });
});
