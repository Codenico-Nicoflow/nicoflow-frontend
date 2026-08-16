import { server } from '__tests__/server';
import type { IRecurrenceRule } from '@nicoflow/shared/types';
import { RecurrenceFreq } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createRecurrenceApi } from './recurrence';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });

const makeRule = (overrides: Partial<IRecurrenceRule> = {}): IRecurrenceRule => ({
  id: 'r1',
  projectId: 'p1',
  title: 'Water the plants',
  notes: null,
  priority: 'medium',
  energy: 'medium',
  estimatedMinutes: null,
  freq: RecurrenceFreq.WEEKLY,
  interval: 1,
  byWeekday: [1],
  byMonthday: null,
  startDate: '2026-03-02',
  endDate: null,
  nextOccurrence: '2026-03-09',
  paused: false,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
  ...overrides,
});

const makeStore = () => {
  const recurrenceApi = createRecurrenceApi(baseQuery);
  const store = configureStore({
    reducer: {
      auth: (state = { token: null }) => state,
      [recurrenceApi.reducerPath]: recurrenceApi.reducer,
    },
    middleware: gDM => gDM().concat(recurrenceApi.middleware),
  });
  return { store, recurrenceApi };
};

describe('recurrenceApi slice', () => {
  it('getRecurrenceRules unwraps the envelope and keeps string IDs', async () => {
    server.use(
      http.get(`${API}/recurrence-rules`, () => HttpResponse.json({ data: { items: [makeRule()] }, error: null }))
    );

    const { store, recurrenceApi } = makeStore();
    const res = await store.dispatch(recurrenceApi.endpoints.getRecurrenceRules.initiate({}));

    expect(res.data?.items).toEqual([makeRule()]);
    expect(typeof res.data?.items[0]?.id).toBe('string');
  });

  it('sends projectId as a query param when filtering', async () => {
    let seen: string | null = null;
    server.use(
      http.get(`${API}/recurrence-rules`, ({ request }) => {
        seen = new URL(request.url).searchParams.get('projectId');
        return HttpResponse.json({ data: { items: [] }, error: null });
      })
    );

    const { store, recurrenceApi } = makeStore();
    await store.dispatch(recurrenceApi.endpoints.getRecurrenceRules.initiate({ projectId: 'p9' }));

    expect(seen).toBe('p9');
  });

  it('createRecurrenceRule posts under the project and omits projectId from the body', async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${API}/projects/p1/recurrence-rules`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: makeRule(), error: null });
      })
    );

    const { store, recurrenceApi } = makeStore();
    const res = await store.dispatch(
      recurrenceApi.endpoints.createRecurrenceRule.initiate({
        projectId: 'p1',
        title: 'Water the plants',
        freq: RecurrenceFreq.WEEKLY,
        interval: 1,
        byWeekday: [1],
        startDate: '2026-03-02',
      })
    );

    expect('data' in res && res.data).toEqual(makeRule());
    expect(body).not.toHaveProperty('projectId');
    expect(body).toMatchObject({ title: 'Water the plants', freq: 'weekly', byWeekday: [1] });
  });

  it('pauseRecurrenceRule sends the paused flag to the pause endpoint', async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.patch(`${API}/recurrence-rules/r1/pause`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: makeRule({ paused: true }), error: null });
      })
    );

    const { store, recurrenceApi } = makeStore();
    const res = await store.dispatch(recurrenceApi.endpoints.pauseRecurrenceRule.initiate({ id: 'r1', paused: true }));

    expect(body).toEqual({ paused: true });
    expect('data' in res && res.data?.paused).toBe(true);
  });

  it('getRecurrenceStats unwraps the derived history', async () => {
    server.use(
      http.get(`${API}/recurrence-rules/r1/stats`, () =>
        HttpResponse.json({ data: { done: 4, missed: 1, cancelled: 0, streak: 2 }, error: null })
      )
    );

    const { store, recurrenceApi } = makeStore();
    const res = await store.dispatch(recurrenceApi.endpoints.getRecurrenceStats.initiate('r1'));

    expect(res.data).toEqual({ done: 4, missed: 1, cancelled: 0, streak: 2 });
  });

  it('surfaces the typed error body so a plan limit can drive an upgrade prompt', async () => {
    server.use(
      http.post(`${API}/projects/p1/recurrence-rules`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'free plan allows up to 3 recurrence rules' } },
          { status: 403 }
        )
      )
    );

    const { store, recurrenceApi } = makeStore();
    const res = await store.dispatch(
      recurrenceApi.endpoints.createRecurrenceRule.initiate({
        projectId: 'p1',
        title: 'Fourth rule',
        freq: RecurrenceFreq.DAILY,
        interval: 1,
        byWeekday: [],
        startDate: '2026-03-02',
      })
    );

    expect('error' in res && res.error).toMatchObject({
      error: { code: 'PLAN_LIMIT_EXCEEDED' },
    });
  });

  it('deleteRecurrenceRule issues a DELETE on the rule id', async () => {
    let called = false;
    server.use(
      http.delete(`${API}/recurrence-rules/r1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { store, recurrenceApi } = makeStore();
    await store.dispatch(recurrenceApi.endpoints.deleteRecurrenceRule.initiate('r1'));

    expect(called).toBe(true);
  });
});
