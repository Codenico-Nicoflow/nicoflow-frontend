import { server } from '__tests__/server';
import type { IAttachment } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import authReducer from '../auth/authSlice';

import { attachmentApi } from './attachmentApi';

const API = 'http://localhost:8080/v1';

const makeAttachment = (overrides: Partial<IAttachment> = {}): IAttachment => ({
  id: 'a1',
  ownerType: 'task',
  ownerId: 't1',
  fileName: 'report.pdf',
  fileSize: 2048,
  mimeType: 'application/pdf',
  createdAt: '2026-07-24T08:00:00Z',
  ...overrides,
});

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, [attachmentApi.reducerPath]: attachmentApi.reducer },
    middleware: gDM => gDM().concat(attachmentApi.middleware),
  });

describe('attachmentApi slice', () => {
  it('getAttachments unwraps the envelope and keeps string IDs', async () => {
    server.use(http.get(`${API}/attachments`, () => HttpResponse.json({ data: [makeAttachment()], error: null })));

    const store = makeStore();
    const res = await store.dispatch(
      attachmentApi.endpoints.getAttachments.initiate({ ownerType: 'task', ownerId: 't1' })
    );

    expect(res.data).toEqual([makeAttachment()]);
    // AC2 — string IDs, no coercion
    const [first] = res.data ?? [];
    expect(typeof first?.id).toBe('string');
    expect(typeof first?.ownerId).toBe('string');
  });

  it('getAttachments sends ownerType + ownerId as query params', async () => {
    let search = '';
    server.use(
      http.get(`${API}/attachments`, ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json({ data: [], error: null });
      })
    );

    const store = makeStore();
    await store.dispatch(attachmentApi.endpoints.getAttachments.initiate({ ownerType: 'task', ownerId: 't1' }));

    expect(search).toContain('ownerType=task');
    expect(search).toContain('ownerId=t1');
  });

  it('getUploadUrl unwraps { url, headers, s3Key }', async () => {
    server.use(
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({
          data: { url: 'https://s3.test', headers: { 'Content-Type': 'application/pdf' }, s3Key: 's3/k' },
          error: null,
        })
      )
    );

    const store = makeStore();
    const res = await store.dispatch(
      attachmentApi.endpoints.getUploadUrl.initiate({
        ownerType: 'task',
        ownerId: 't1',
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048,
      })
    );

    expect('data' in res && res.data).toEqual({
      url: 'https://s3.test',
      headers: { 'Content-Type': 'application/pdf' },
      s3Key: 's3/k',
    });
  });

  it('getDownloadUrl unwraps { url } (not { downloadUrl })', async () => {
    server.use(
      http.get(`${API}/attachments/a1/download-url`, () =>
        HttpResponse.json({ data: { url: 'https://s3.test/get' }, error: null })
      )
    );

    const store = makeStore();
    const res = await store.dispatch(attachmentApi.endpoints.getDownloadUrl.initiate('a1'));

    expect('data' in res && res.data).toEqual({ url: 'https://s3.test/get' });
  });

  it('confirm invalidates the owner tag so the list refetches', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/attachments`, () => {
        listCalls += 1;
        return HttpResponse.json({ data: [makeAttachment()], error: null });
      }),
      http.post(`${API}/attachments`, () =>
        HttpResponse.json({ data: makeAttachment({ id: 'a2', ownerId: 't1' }), error: null }, { status: 201 })
      )
    );

    const store = makeStore();
    await store.dispatch(attachmentApi.endpoints.getAttachments.initiate({ ownerType: 'task', ownerId: 't1' }));
    expect(listCalls).toBe(1);

    await store.dispatch(attachmentApi.endpoints.confirmAttachment.initiate({ s3Key: 's3/k', fileName: 'r.pdf' }));
    // give the invalidation-driven refetch a tick
    await new Promise(r => setTimeout(r, 0));

    expect(listCalls).toBe(2);
  });

  it('delete invalidates the owner tag so the list refetches', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/attachments`, () => {
        listCalls += 1;
        return HttpResponse.json({ data: [makeAttachment()], error: null });
      }),
      http.delete(`${API}/attachments/a1`, () => new HttpResponse(null, { status: 204 }))
    );

    const store = makeStore();
    await store.dispatch(attachmentApi.endpoints.getAttachments.initiate({ ownerType: 'task', ownerId: 't1' }));
    expect(listCalls).toBe(1);

    await store.dispatch(attachmentApi.endpoints.deleteAttachment.initiate({ id: 'a1', ownerId: 't1' }));
    await new Promise(r => setTimeout(r, 0));

    expect(listCalls).toBe(2);
  });
});
