import { server } from '__tests__/server';
import { ProcessingResult } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeBucket } from '@/mocks/handlers';

import authReducer from '../auth/authSlice';

import { bucketApi } from './bucketApi';

const API = 'http://localhost:8080/v1';

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, [bucketApi.reducerPath]: bucketApi.reducer },
    middleware: gDM => gDM().concat(bucketApi.middleware),
  });

describe('bucketApi slice', () => {
  it('getBuckets unwraps the { items } envelope to the bare list', async () => {
    server.use(
      http.get(`${API}/bucket`, () => HttpResponse.json({ data: { items: [makeBucket({ id: 'b1' })] }, error: null }))
    );

    const store = makeStore();
    const res = await store.dispatch(bucketApi.endpoints.getBuckets.initiate());

    expect(res.data).toEqual({ items: [expect.objectContaining({ id: 'b1' })] });
  });

  it('getBucket unwraps the envelope to a single bucket', async () => {
    server.use(http.get(`${API}/bucket/b1`, () => HttpResponse.json({ data: makeBucket({ id: 'b1' }), error: null })));

    const store = makeStore();
    const res = await store.dispatch(bucketApi.endpoints.getBucket.initiate('b1'));

    expect(res.data).toEqual(expect.objectContaining({ id: 'b1' }));
  });

  it('createBucket POSTs the content body and unwraps the created bucket', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/bucket`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeBucket({ id: 'b2', content: 'new thought' }), error: null });
      })
    );

    const store = makeStore();
    const res = await store.dispatch(bucketApi.endpoints.createBucket.initiate({ content: 'new thought' }));

    expect(body).toEqual({ content: 'new thought' });
    expect('data' in res ? res.data : undefined).toEqual(expect.objectContaining({ content: 'new thought' }));
  });

  it('updateBucket PATCHes /bucket/:id with the partial body', async () => {
    let body: unknown;
    server.use(
      http.patch(`${API}/bucket/b1`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeBucket({ id: 'b1', content: 'edited' }), error: null });
      })
    );

    const store = makeStore();
    const res = await store.dispatch(
      bucketApi.endpoints.updateBucket.initiate({ id: 'b1', data: { content: 'edited' } })
    );

    expect(body).toEqual({ content: 'edited' });
    expect('data' in res ? res.data : undefined).toEqual(expect.objectContaining({ content: 'edited' }));
  });

  it('deleteBucket DELETEs /bucket/:id', async () => {
    let hit = false;
    server.use(
      http.delete(`${API}/bucket/b1`, () => {
        hit = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const store = makeStore();
    await store.dispatch(bucketApi.endpoints.deleteBucket.initiate('b1'));

    expect(hit).toBe(true);
  });

  it('processBucket POSTs /bucket/:id/process with the process DTO and unwraps the result', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/bucket/b1/process`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          data: makeBucket({ id: 'b1', processedAt: '2026-07-13T00:00:00Z', processingResult: 'task' }),
          error: null,
        });
      })
    );

    const store = makeStore();
    const res = await store.dispatch(
      bucketApi.endpoints.processBucket.initiate({
        id: 'b1',
        data: {
          processingResult: ProcessingResult.TASK,
          projectId: 'p1',
          taskDetails: { title: 'Do it', priority: 'low' },
        },
      })
    );

    expect(body).toEqual({
      processingResult: 'task',
      projectId: 'p1',
      taskDetails: { title: 'Do it', priority: 'low' },
    });
    expect('data' in res ? res.data : undefined).toEqual(
      expect.objectContaining({ processedAt: '2026-07-13T00:00:00Z', processingResult: 'task' })
    );
  });

  it('a mutation invalidates the LIST tag so getBuckets refetches', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/bucket`, () => {
        listCalls += 1;
        return HttpResponse.json({ data: { items: [] }, error: null });
      }),
      http.post(`${API}/bucket`, () => HttpResponse.json({ data: makeBucket({ id: 'bx' }), error: null }))
    );

    const store = makeStore();
    const listSub = store.dispatch(bucketApi.endpoints.getBuckets.initiate());
    await listSub;
    expect(listCalls).toBe(1);

    await store.dispatch(bucketApi.endpoints.createBucket.initiate({ content: 'x' }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(listCalls).toBe(2);
    listSub.unsubscribe();
  });
});
