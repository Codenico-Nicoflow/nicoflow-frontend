import { server } from '__tests__/server';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import authReducer from '../auth/authSlice';

import { taskApi } from './taskApi';

const API = 'http://localhost:8080/v1';

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, [taskApi.reducerPath]: taskApi.reducer },
    middleware: gDM => gDM().concat(taskApi.middleware),
  });

describe('taskApi slice', () => {
  it('unwraps the { items } envelope for getFocus and passes the query params', async () => {
    let seen: URLSearchParams | undefined;
    server.use(
      http.get(`${API}/focus`, ({ request }) => {
        seen = new URL(request.url).searchParams;
        return HttpResponse.json({ data: { items: [makeTask({ id: 'f1' })] }, error: null });
      })
    );

    const store = makeStore();
    const res = await store.dispatch(taskApi.endpoints.getFocus.initiate({ available: 30, energy: 'low', limit: 5 }));

    // The hook data is the bare ITask[], not the { items } / envelope wrapper.
    expect(res.data).toEqual([expect.objectContaining({ id: 'f1' })]);
    expect(seen?.get('available')).toBe('30');
    expect(seen?.get('energy')).toBe('low');
    expect(seen?.get('limit')).toBe('5');
  });

  it('unwraps the time-spread buckets and sends the browser tz', async () => {
    let sentTz: string | null = null;
    server.use(
      http.get(`${API}/time-spread`, ({ request }) => {
        sentTz = new URL(request.url).searchParams.get('tz');
        return HttpResponse.json({
          data: { today: [makeTask({ id: 't1' })], tomorrow: [], thisWeek: [] },
          error: null,
        });
      })
    );

    const store = makeStore();
    const res = await store.dispatch(taskApi.endpoints.getTimeSpread.initiate());

    expect(res.data).toEqual({ today: [expect.objectContaining({ id: 't1' })], tomorrow: [], thisWeek: [] });
    expect(sentTz).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('scheduleTask PATCHes /schedule with the scheduledFor + rollsOver body', async () => {
    let body: unknown;
    server.use(
      http.patch(`${API}/tasks/t1/schedule`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeTask({ id: 't1', scheduledFor: '2026-07-06' }), error: null });
      })
    );

    const store = makeStore();
    const res = await store.dispatch(
      taskApi.endpoints.scheduleTask.initiate({ id: 't1', scheduledFor: '2026-07-06', rollsOver: true })
    );

    expect(body).toEqual({ scheduledFor: '2026-07-06', rollsOver: true });
    expect('data' in res ? res.data : undefined).toEqual(expect.objectContaining({ scheduledFor: '2026-07-06' }));
  });

  it('a task mutation invalidates the Focus and TimeSpread tags (derived views refetch)', async () => {
    let focusCalls = 0;
    let spreadCalls = 0;
    server.use(
      http.get(`${API}/focus`, () => {
        focusCalls += 1;
        return HttpResponse.json({ data: { items: [] }, error: null });
      }),
      http.get(`${API}/time-spread`, () => {
        spreadCalls += 1;
        return HttpResponse.json({ data: { today: [], tomorrow: [], thisWeek: [] }, error: null });
      }),
      http.patch(`${API}/tasks/t1/status`, () =>
        HttpResponse.json({ data: makeTask({ id: 't1', status: 'done' }), error: null })
      )
    );

    const store = makeStore();
    // Keep the subscriptions alive — RTK Query only auto-refetches invalidated
    // queries that still have active subscribers.
    const focusSub = store.dispatch(taskApi.endpoints.getFocus.initiate({}));
    const spreadSub = store.dispatch(taskApi.endpoints.getTimeSpread.initiate());
    await Promise.all([focusSub, spreadSub]);
    expect(focusCalls).toBe(1);
    expect(spreadCalls).toBe(1);

    // A status change should invalidate both derived views, forcing a refetch.
    await store.dispatch(taskApi.endpoints.updateTaskStatus.initiate({ id: 't1', status: 'done' }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(focusCalls).toBe(2);
    expect(spreadCalls).toBe(2);

    focusSub.unsubscribe();
    spreadSub.unsubscribe();
  });
});
