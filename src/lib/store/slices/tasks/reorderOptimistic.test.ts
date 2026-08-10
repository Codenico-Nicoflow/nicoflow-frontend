import { server } from '__tests__/server';
import { configureStore } from '@reduxjs/toolkit';
import type { InfiniteData } from '@reduxjs/toolkit/query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import authReducer from '../auth/authSlice';

import { taskApi } from './taskApi';
import type { GetTasksPage } from './type';

const seed = () => [
  makeTask({ id: 't1', title: 'first', displayOrder: 0 }),
  makeTask({ id: 't2', title: 'second', displayOrder: 1 }),
  makeTask({ id: 't3', title: 'third', displayOrder: 2 }),
];

const pagedEnvelope = (items: ReturnType<typeof makeTask>[]) => ({
  data: { items, nextCursor: '' },
  error: null,
});

const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [taskApi.reducerPath]: taskApi.reducer,
    },
    middleware: gDM => gDM().concat(taskApi.middleware),
  });

const currentOrder = (store: ReturnType<typeof makeStore>) => {
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

    const store = makeStore();
    await store.dispatch(taskApi.endpoints.getTasks.initiate({ projectId: 'p1' }));
    expect(currentOrder(store)).toEqual(['t1', 't2', 't3']);

    const promise = store.dispatch(taskApi.endpoints.reorderTask.initiate({ id: 't3', displayOrder: 0 }));

    // Optimistically repacked before the request resolves.
    expect(currentOrder(store)).toEqual(['t3', 't1', 't2']);

    await promise;
    expect(currentOrder(store)).toEqual(['t3', 't1', 't2']);
  });

  it('rolls back to the previous order when the request fails', async () => {
    server.use(
      http.get('http://localhost:8080/v1/projects/p1/tasks', () => HttpResponse.json(pagedEnvelope(seed()))),
      http.patch('http://localhost:8080/v1/tasks/t3/reorder', () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom' } }, { status: 500 })
      )
    );

    const store = makeStore();
    await store.dispatch(taskApi.endpoints.getTasks.initiate({ projectId: 'p1' }));

    const promise = store.dispatch(taskApi.endpoints.reorderTask.initiate({ id: 't3', displayOrder: 0 }));

    expect(currentOrder(store)).toEqual(['t3', 't1', 't2']);

    await promise;
    expect(currentOrder(store)).toEqual(['t1', 't2', 't3']);
  });
});
