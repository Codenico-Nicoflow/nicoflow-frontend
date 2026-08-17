import { server } from '__tests__/server';
import type { ITask } from '@nicoflow/shared/types';
import { TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import type { InfiniteData } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createTaskApi } from './tasks';
import type { GetTasksPage } from './tasks.types';

const baseQuery = fetchBaseQuery({ baseUrl: 'http://localhost:8080/v1' });

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

const seed = () => [
  makeTask({ id: 't1', title: 'first', displayOrder: 0 }),
  makeTask({ id: 't2', title: 'second', displayOrder: 1 }),
  makeTask({ id: 't3', title: 'third', displayOrder: 2 }),
];

const pagedEnvelope = (items: ITask[]) => ({
  data: { items, nextCursor: '' },
  error: null,
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

const currentOrder = (store: ReturnType<typeof makeStore>['store'], taskApi: ReturnType<typeof createTaskApi>) => {
  const state = taskApi.endpoints.getTasks.select({ projectId: 'p1' })(store.getState());
  const infiniteData = state.data as InfiniteData<GetTasksPage, string> | undefined;
  const allItems = infiniteData?.pages.flatMap(p => p.items) ?? [];
  return [...allItems].sort((a, b) => a.displayOrder - b.displayOrder).map(t => t.id);
};

describe('reorderTask — optimistic cache update', () => {
  it('moves the task to the target order immediately and keeps it on success', async () => {
    server.use(
      http.get('http://localhost:8080/v1/projects/p1/tasks', () => HttpResponse.json(pagedEnvelope(seed()))),
      http.patch('http://localhost:8080/v1/tasks/t3/reorder', () =>
        HttpResponse.json({ data: makeTask({ id: 't3', displayOrder: 0 }), error: null })
      )
    );

    const { store, taskApi } = makeStore();
    await store.dispatch(taskApi.endpoints.getTasks.initiate({ projectId: 'p1' }));
    expect(currentOrder(store, taskApi)).toEqual(['t1', 't2', 't3']);

    const promise = store.dispatch(taskApi.endpoints.reorderTask.initiate({ id: 't3', displayOrder: 0 }));

    expect(currentOrder(store, taskApi)).toEqual(['t3', 't1', 't2']);

    await promise;
    expect(currentOrder(store, taskApi)).toEqual(['t3', 't1', 't2']);
  });

  it('rolls back to the previous order when the request fails', async () => {
    server.use(
      http.get('http://localhost:8080/v1/projects/p1/tasks', () => HttpResponse.json(pagedEnvelope(seed()))),
      http.patch('http://localhost:8080/v1/tasks/t3/reorder', () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom' } }, { status: 500 })
      )
    );

    const { store, taskApi } = makeStore();
    await store.dispatch(taskApi.endpoints.getTasks.initiate({ projectId: 'p1' }));

    const promise = store.dispatch(taskApi.endpoints.reorderTask.initiate({ id: 't3', displayOrder: 0 }));

    expect(currentOrder(store, taskApi)).toEqual(['t3', 't1', 't2']);

    await promise;
    expect(currentOrder(store, taskApi)).toEqual(['t1', 't2', 't3']);
  });
});
