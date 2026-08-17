import { server } from '__tests__/server';
import type { ITask } from '@nicoflow/shared/types';
import { TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createTaskApi } from './tasks';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });

const makeTask = (overrides: Partial<ITask> = {}): ITask => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Sample Task',
  notes: null,
  status: TaskStatus.ACTIVE,
  priority: TaskPriority.MEDIUM,
  energy: TaskEnergy.MEDIUM,
  rollsOver: true,
  scheduledFor: null,
  scheduledTime: null,
  estimatedMinutes: null,
  url: null,
  displayOrder: 0,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  totalFocusSeconds: 0,
  subtaskCount: 0,
  openSubtaskCount: 0,
  ...overrides,
});

const makeStore = () => {
  const taskApi = createTaskApi(baseQuery);
  const store = configureStore({
    reducer: {
      auth: (state = { token: null }) => state,
      [taskApi.reducerPath]: taskApi.reducer,
    },
    middleware: gDM => gDM().concat(taskApi.middleware),
  });
  return { store, taskApi };
};

describe('taskApi slice', () => {
  it('unwraps the { items } envelope for getFocus and passes the query params', async () => {
    let seen: URLSearchParams | undefined;
    server.use(
      http.get(`${API}/focus`, ({ request }) => {
        seen = new URL(request.url).searchParams;
        return HttpResponse.json({ data: { items: [makeTask({ id: 'f1' })] }, error: null });
      })
    );

    const { store, taskApi } = makeStore();
    const res = await store.dispatch(taskApi.endpoints.getFocus.initiate({ available: 30, energy: 'low', limit: 5 }));

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

    const { store, taskApi } = makeStore();
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

    const { store, taskApi } = makeStore();
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

    const { store, taskApi } = makeStore();
    const focusSub = store.dispatch(taskApi.endpoints.getFocus.initiate({}));
    const spreadSub = store.dispatch(taskApi.endpoints.getTimeSpread.initiate());
    await Promise.all([focusSub, spreadSub]);
    expect(focusCalls).toBe(1);
    expect(spreadCalls).toBe(1);

    await store.dispatch(taskApi.endpoints.updateTaskStatus.initiate({ id: 't1', status: 'done' }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(focusCalls).toBe(2);
    expect(spreadCalls).toBe(2);

    focusSub.unsubscribe();
    spreadSub.unsubscribe();
  });
});
