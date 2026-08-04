import { server } from '__tests__/server';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { ApiErrorBody, INote, INoteDetail } from '@/lib/types';

import authReducer from '../auth/authSlice';

import { noteApi } from './noteApi';

const API = 'http://localhost:8080/v1';

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

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, [noteApi.reducerPath]: noteApi.reducer },
    middleware: gDM => gDM().concat(noteApi.middleware),
  });

describe('noteApi slice', () => {
  it('getNotes unwraps the envelope and keeps string IDs', async () => {
    server.use(http.get(`${API}/notes`, () => HttpResponse.json({ data: [makeNote()], error: null })));

    const store = makeStore();
    const res = await store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p1' }));

    expect(res.data).toEqual([makeNote()]);
    expect(typeof res.data?.[0]?.id).toBe('string');
  });

  it('getNotes sends projectId as a query param', async () => {
    let seen: string | null = null;
    server.use(
      http.get(`${API}/notes`, ({ request }) => {
        seen = new URL(request.url).searchParams.get('projectId');
        return HttpResponse.json({ data: [], error: null });
      })
    );

    const store = makeStore();
    await store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p9' }));

    expect(seen).toBe('p9');
  });

  // The list shape carries no body at all — that is the whole point of the split.
  it('getNotes rows carry an excerpt and no content', async () => {
    server.use(http.get(`${API}/notes`, () => HttpResponse.json({ data: [makeNote()], error: null })));

    const store = makeStore();
    const res = await store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p1' }));
    const row = res.data?.[0];

    expect(row?.excerpt).toBe('Reference material for the weekly review.');
    expect(row).not.toHaveProperty('content');
  });

  it('getNote unwraps the scalar and returns the document body', async () => {
    server.use(http.get(`${API}/notes/n1`, () => HttpResponse.json({ data: makeNoteDetail(), error: null })));

    const store = makeStore();
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

    const store = makeStore();
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

    const store = makeStore();
    const res = await store.dispatch(noteApi.endpoints.updateNote.initiate({ id: 'n1', version: 3, title: 'Renamed' }));

    expect(method).toBe('PATCH');
    expect(body).toEqual({ version: 3, title: 'Renamed' });
    expect('data' in res && res.data?.version).toBe(4);
  });

  // A stale version is a conflict the caller has to surface and stop on, so the
  // code has to survive transformErrorResponse and be readable off the rejection.
  it('updateNote surfaces a 409 as a typed CONFLICT error', async () => {
    server.use(
      http.patch(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'CONFLICT', message: 'stale version' } }, { status: 409 })
      )
    );

    const store = makeStore();
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

    const store = makeStore();
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

    const store = makeStore();
    await store.dispatch(noteApi.endpoints.deleteNote.initiate('n1'));

    expect(method).toBe('DELETE');
  });

  // Tag wiring: a save has to move the row's excerpt/updatedAt in the list too,
  // so the list refetches rather than showing a stale summary of a saved body.
  it('updateNote invalidates both the scalar and the list', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/notes`, () => {
        listCalls += 1;
        return HttpResponse.json({ data: [makeNote()], error: null });
      }),
      http.patch(`${API}/notes/n1`, () => HttpResponse.json({ data: makeNoteDetail({ version: 2 }), error: null }))
    );

    const store = makeStore();
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
        return HttpResponse.json({ data: [], error: null });
      }),
      http.post(`${API}/notes`, () => HttpResponse.json({ data: makeNoteDetail(), error: null }, { status: 201 }))
    );

    const store = makeStore();
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
        return HttpResponse.json({ data: [makeNote()], error: null });
      }),
      http.delete(`${API}/notes/n1`, () => new HttpResponse(null, { status: 204 }))
    );

    const store = makeStore();
    const sub = store.dispatch(noteApi.endpoints.getNotes.initiate({ projectId: 'p1' }));
    await sub;

    await store.dispatch(noteApi.endpoints.deleteNote.initiate('n1'));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(listCalls).toBe(2);
    sub.unsubscribe();
  });
});
