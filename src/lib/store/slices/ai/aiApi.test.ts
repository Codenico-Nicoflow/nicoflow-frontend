import { server } from '__tests__/server';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { AISessionView, AIUsageView } from '@/features/AI/types';

import authReducer from '../auth/authSlice';

import { aiApi } from './aiApi';

const API = 'http://localhost:8080/v1';

const makeSession = (overrides: Partial<AISessionView> = {}): AISessionView => ({
  id: 's1',
  title: 'Sprint planning',
  createdAt: '2026-07-26T08:00:00Z',
  updatedAt: '2026-07-26T09:00:00Z',
  ...overrides,
});

const makeUsage = (overrides: Partial<AIUsageView> = {}): AIUsageView => ({
  used: 3,
  limit: 5,
  scope: 'lifetime',
  month: null,
  ...overrides,
});

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, [aiApi.reducerPath]: aiApi.reducer },
    middleware: gDM => gDM().concat(aiApi.middleware),
  });

describe('aiApi slice', () => {
  it('getAISessions unwraps the envelope and keeps string IDs', async () => {
    server.use(http.get(`${API}/ai/sessions`, () => HttpResponse.json({ data: [makeSession()], error: null })));

    const store = makeStore();
    const res = await store.dispatch(aiApi.endpoints.getAISessions.initiate());

    expect(res.data).toEqual([makeSession()]);
    const [first] = res.data ?? [];
    expect(typeof first?.id).toBe('string');
  });

  it('getAISession unwraps a session with its messages', async () => {
    server.use(
      http.get(`${API}/ai/sessions/s1`, () =>
        HttpResponse.json({
          data: {
            ...makeSession(),
            messages: [{ id: 'm1', role: 'assistant', content: 'hi', createdAt: '2026-07-26T09:01:00Z' }],
          },
          error: null,
        })
      )
    );

    const store = makeStore();
    const res = await store.dispatch(aiApi.endpoints.getAISession.initiate('s1'));

    expect(res.data?.messages).toHaveLength(1);
    expect(res.data?.messages[0]?.role).toBe('assistant');
  });

  it('getAIUsage unwraps { used, limit, scope, month }', async () => {
    server.use(http.get(`${API}/ai/usage`, () => HttpResponse.json({ data: makeUsage(), error: null })));

    const store = makeStore();
    const res = await store.dispatch(aiApi.endpoints.getAIUsage.initiate());

    expect(res.data).toEqual(makeUsage());
  });

  it('getAIUsage fetches once and does not poll on a timer', async () => {
    // AC3 — no pollingInterval: a single subscription triggers exactly one fetch
    // and stays put across a window where a poll, if configured, would refire.
    let usageCalls = 0;
    server.use(
      http.get(`${API}/ai/usage`, () => {
        usageCalls += 1;
        return HttpResponse.json({ data: makeUsage(), error: null });
      })
    );

    const store = makeStore();
    store.dispatch(aiApi.endpoints.getAIUsage.initiate());
    await new Promise(r => setTimeout(r, 50));

    expect(usageCalls).toBe(1);
  });

  it('create invalidates the list tag so sessions refetch', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/ai/sessions`, () => {
        listCalls += 1;
        return HttpResponse.json({ data: [makeSession()], error: null });
      }),
      http.post(`${API}/ai/sessions`, () =>
        HttpResponse.json({ data: makeSession({ id: 's2' }), error: null }, { status: 201 })
      )
    );

    const store = makeStore();
    await store.dispatch(aiApi.endpoints.getAISessions.initiate());
    expect(listCalls).toBe(1);

    await store.dispatch(aiApi.endpoints.createAISession.initiate({ title: 'New' }));
    await new Promise(r => setTimeout(r, 0));

    expect(listCalls).toBe(2);
  });

  it('delete invalidates the list tag so sessions refetch', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/ai/sessions`, () => {
        listCalls += 1;
        return HttpResponse.json({ data: [makeSession()], error: null });
      }),
      http.delete(`${API}/ai/sessions/s1`, () => new HttpResponse(null, { status: 204 }))
    );

    const store = makeStore();
    await store.dispatch(aiApi.endpoints.getAISessions.initiate());
    expect(listCalls).toBe(1);

    await store.dispatch(aiApi.endpoints.deleteAISession.initiate('s1'));
    await new Promise(r => setTimeout(r, 0));

    expect(listCalls).toBe(2);
  });
});
