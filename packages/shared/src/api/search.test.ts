import { server } from '__tests__/server';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createSearchApi } from './search';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });

const makeStore = () => {
  const searchApi = createSearchApi(baseQuery);
  const store = configureStore({
    reducer: {
      auth: (state = { token: null }) => state,
      [searchApi.reducerPath]: searchApi.reducer,
    },
    middleware: gDM => gDM().concat(searchApi.middleware),
  });
  return { store, searchApi };
};

describe('searchApi slice', () => {
  it('sends q single-encoded (no double-encoding of the space) and unwraps the envelope', async () => {
    let seen: URLSearchParams | undefined;
    server.use(
      http.get(`${API}/search`, ({ request }) => {
        seen = new URL(request.url).searchParams;
        return HttpResponse.json({ data: { tasks: [], projects: [], areas: [] }, error: null });
      })
    );

    const { store, searchApi } = makeStore();
    const res = await store.dispatch(searchApi.endpoints.search.initiate('qa area'));

    expect(seen?.get('q')).toBe('qa area');
    expect(seen?.get('types')).toBe('task,project,area');
    expect('data' in res ? res.data : undefined).toEqual({ tasks: [], projects: [], areas: [] });
  });
});
