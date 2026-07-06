import { server } from '__tests__/server';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import authReducer from '../auth/authSlice';

import { taskApi } from './taskApi';

const seed = () => [
  makeTask({ id: 't1', title: 'first', displayOrder: 0 }),
  makeTask({ id: 't2', title: 'second', displayOrder: 1 }),
  makeTask({ id: 't3', title: 'third', displayOrder: 2 }),
];

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
  return [...(state.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder).map(t => t.id);
};

describe('reorderTask — optimistic cache update', () => {
  it('moves the task to the target order immediately and keeps it on success', async () => {
    server.use(
      http.get('http://localhost:8080/v1/projects/p1/tasks', () =>
        HttpResponse.json({ data: { items: seed() }, error: null })
      ),
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
      http.get('http://localhost:8080/v1/projects/p1/tasks', () =>
        HttpResponse.json({ data: { items: seed() }, error: null })
      ),
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
