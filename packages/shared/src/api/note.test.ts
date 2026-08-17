import { server } from '__tests__/server';
import type { ApiErrorBody, INote, INoteDetail } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createNoteApi } from './note';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });

const makeNote = (overrides: Partial<INote> = {}): INote => ({
  id: 'n1',
  projectId: 'p1',
  title: 'GTD structure thread',
  excerpt: 'Reference material for the weekly review.',
  version: 1,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
  ...overrides,
});

const makeNoteDetail = (overrides: Partial<INoteDetail> = {}): INoteDetail => ({
  id: 'n1',
  projectId: 'p1',
  title: 'GTD structure thread',
  content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body' }] }] },
  version: 1,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
  ...overrides,
});

const pagedEnvelope = (items: INote[]) => ({ data: { items, nextCursor: '' }, error: null });

const makeStore = () => {
  const noteApi = createNoteApi(baseQuery);
  const store = configureStore({
    reducer: {
      auth: (state = { token: null }) => state,
      [noteApi.reducerPath]: noteApi.reducer,
    },
    middleware: gDM => gDM().concat(noteApi.middleware),
  });
  return { store, noteApi };
};

describe('noteApi slice', () => {
  it('getNotes unwraps the paginated envelope and keeps string IDs', async () => {
    server.use(http.get(`${API}/notes`, () => HttpResponse.json(pagedEnvelope([makeNote()]))));

    const { store, noteApi } = makeStore();
    const res = await store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p1' }));

    const firstPage = (res.data as { pages: { items: INote[] }[] } | undefined)?.pages[0];
    expect(firstPage?.items[0]).toEqual(makeNote());
    expect(typeof firstPage?.items[0]?.id).toBe('string');
  });

  it('getNotes sends projectId as a query param', async () => {
    let seen: string | null = null;
    server.use(
      http.get(`${API}/notes`, ({ request }) => {
        seen = new URL(request.url).searchParams.get('projectId');
        return HttpResponse.json(pagedEnvelope([]));
      })
    );

    const { store, noteApi } = makeStore();
    await store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p9' }));

    expect(seen).toBe('p9');
  });

  it('getNotes rows carry an excerpt and no content', async () => {
    server.use(http.get(`${API}/notes`, () => HttpResponse.json(pagedEnvelope([makeNote()]))));

    const { store, noteApi } = makeStore();
    const res = await store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p1' }));
    const row = (res.data as { pages: { items: INote[] }[] } | undefined)?.pages[0]?.items[0];

    expect(row?.excerpt).toBe('Reference material for the weekly review.');
    expect(row).not.toHaveProperty('content');
  });

  it('getNote unwraps the scalar and returns the document body', async () => {
    server.use(http.get(`${API}/notes/n1`, () => HttpResponse.json({ data: makeNoteDetail(), error: null })));

    const { store, noteApi } = makeStore();
    const res = await store.dispatch(noteApi.endpoints.getNote.initiate('n1'));

    expect(res.data?.content.type).toBe('doc');
    expect(res.data).not.toHaveProperty('excerpt');
  });

  it('createNote posts the body and returns the detail shape', async () => {
    let body: unknown = null;
    server.use(
      http.post(`${API}/notes`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeNoteDetail(), error: null }, { status: 201 });
      })
    );

    const { store, noteApi } = makeStore();
    const res = await store.dispatch(
      noteApi.endpoints.createNote.initiate({ projectId: 'p1', title: 'GTD structure thread' })
    );

    expect(body).toEqual({ projectId: 'p1', title: 'GTD structure thread' });
    expect('data' in res && res.data?.version).toBe(1);
  });

  it('updateNote sends version in the body and the id in the path', async () => {
    let body: unknown = null;
    let method: string | null = null;
    server.use(
      http.patch(`${API}/notes/n1`, async ({ request }) => {
        method = request.method;
        body = await request.json();
        return HttpResponse.json({ data: makeNoteDetail({ version: 4 }), error: null });
      })
    );

    const { store, noteApi } = makeStore();
    const res = await store.dispatch(noteApi.endpoints.updateNote.initiate({ id: 'n1', version: 3, title: 'Renamed' }));

    expect(method).toBe('PATCH');
    expect(body).toEqual({ version: 3, title: 'Renamed' });
    expect('data' in res && res.data?.version).toBe(4);
  });

  it('updateNote surfaces a 409 as a typed CONFLICT error', async () => {
    server.use(
      http.patch(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'CONFLICT', message: 'stale version' } }, { status: 409 })
      )
    );

    const { store, noteApi } = makeStore();
    const res = await store.dispatch(noteApi.endpoints.updateNote.initiate({ id: 'n1', version: 1 }));

    expect('error' in res).toBe(true);
    const error = 'error' in res ? (res.error as ApiErrorBody) : undefined;
    expect(error?.code).toBe('CONFLICT');
  });

  it('distinguishes a non-conflict failure from a stale-version conflict', async () => {
    server.use(
      http.patch(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'gone' } }, { status: 404 })
      )
    );

    const { store, noteApi } = makeStore();
    const res = await store.dispatch(noteApi.endpoints.updateNote.initiate({ id: 'n1', version: 1 }));

    const error = 'error' in res ? (res.error as ApiErrorBody) : undefined;
    expect(error?.code).toBe('RESOURCE_NOT_FOUND');
    expect(error?.code).not.toBe('CONFLICT');
  });

  it('deleteNote issues a DELETE on the note id', async () => {
    let method: string | null = null;
    server.use(
      http.delete(`${API}/notes/n1`, ({ request }) => {
        method = request.method;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { store, noteApi } = makeStore();
    await store.dispatch(noteApi.endpoints.deleteNote.initiate('n1'));

    expect(method).toBe('DELETE');
  });

  it('updateNote invalidates both the scalar and the list', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/notes`, () => {
        listCalls += 1;
        return HttpResponse.json(pagedEnvelope([makeNote()]));
      }),
      http.patch(`${API}/notes/n1`, () => HttpResponse.json({ data: makeNoteDetail({ version: 2 }), error: null }))
    );

    const { store, noteApi } = makeStore();
    const sub = store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p1' }));
    await sub;
    expect(listCalls).toBe(1);

    await store.dispatch(noteApi.endpoints.updateNote.initiate({ id: 'n1', version: 1, title: 'Renamed' }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(listCalls).toBe(2);
    sub.unsubscribe();
  });

  it('createNote invalidates the list', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/notes`, () => {
        listCalls += 1;
        return HttpResponse.json(pagedEnvelope([]));
      }),
      http.post(`${API}/notes`, () => HttpResponse.json({ data: makeNoteDetail(), error: null }, { status: 201 }))
    );

    const { store, noteApi } = makeStore();
    const sub = store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p1' }));
    await sub;

    await store.dispatch(noteApi.endpoints.createNote.initiate({ projectId: 'p1', title: 'New' }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(listCalls).toBe(2);
    sub.unsubscribe();
  });

  it('deleteNote invalidates the list', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/notes`, () => {
        listCalls += 1;
        return HttpResponse.json(pagedEnvelope([makeNote()]));
      }),
      http.delete(`${API}/notes/n1`, () => new HttpResponse(null, { status: 204 }))
    );

    const { store, noteApi } = makeStore();
    const sub = store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p1' }));
    await sub;

    await store.dispatch(noteApi.endpoints.deleteNote.initiate('n1'));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(listCalls).toBe(2);
    sub.unsubscribe();
  });
});
