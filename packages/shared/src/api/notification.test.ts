import { server } from '__tests__/server';
import type { INotification } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createNotificationApi } from './notification';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });

const makeNotification = (overrides: Partial<INotification> = {}): INotification => ({
  id: 'n1',
  type: 'task_due_soon',
  title: 'Task due',
  body: 'This task is scheduled soon.',
  metadata: {},
  isRead: false,
  readAt: null,
  createdAt: '2026-07-14T08:00:00Z',
  ...overrides,
});

const makeStore = () => {
  const notificationApi = createNotificationApi(baseQuery);
  const store = configureStore({
    reducer: {
      auth: (state = { token: null }) => state,
      [notificationApi.reducerPath]: notificationApi.reducer,
    },
    middleware: gDM => gDM().concat(notificationApi.middleware),
  });
  return { store, notificationApi };
};

describe('notificationApi slice', () => {
  it('getNotifications unwraps the { items, nextCursor } envelope', async () => {
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({ data: { items: [makeNotification({ id: 'n1' })], nextCursor: 'cur' }, error: null })
      )
    );

    const { store, notificationApi } = makeStore();
    const res = await store.dispatch(notificationApi.endpoints.getNotifications.initiate({}));

    expect(res.data).toEqual({ items: [expect.objectContaining({ id: 'n1' })], nextCursor: 'cur' });
  });

  it('getNotifications forwards isRead + cursor as query params', async () => {
    let url = '';
    server.use(
      http.get(`${API}/notifications`, ({ request }) => {
        url = new URL(request.url).search;
        return HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null });
      })
    );

    const { store, notificationApi } = makeStore();
    await store.dispatch(notificationApi.endpoints.getNotifications.initiate({ isRead: false, cursor: 'abc' }));

    expect(url).toContain('isRead=false');
    expect(url).toContain('cursor=abc');
  });

  it('getUnreadCount unwraps to { count }', async () => {
    server.use(
      http.get(`${API}/notifications/unread-count`, () => HttpResponse.json({ data: { count: 3 }, error: null }))
    );

    const { store, notificationApi } = makeStore();
    const res = await store.dispatch(notificationApi.endpoints.getUnreadCount.initiate());

    expect(res.data).toEqual({ count: 3 });
  });

  it('markRead PATCHes /:id/read and invalidates both Notification + NotificationCount', async () => {
    let readHit = false;
    let countCalls = 0;
    server.use(
      http.get(`${API}/notifications/unread-count`, () => {
        countCalls += 1;
        return HttpResponse.json({ data: { count: countCalls === 1 ? 2 : 1 }, error: null });
      }),
      http.patch(`${API}/notifications/n1/read`, () => {
        readHit = true;
        return HttpResponse.json({ data: makeNotification({ id: 'n1', isRead: true }), error: null });
      })
    );

    const { store, notificationApi } = makeStore();
    const countSub = store.dispatch(notificationApi.endpoints.getUnreadCount.initiate());
    await countSub;
    expect(countCalls).toBe(1);

    await store.dispatch(notificationApi.endpoints.markRead.initiate('n1'));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(readHit).toBe(true);
    expect(countCalls).toBe(2);
    countSub.unsubscribe();
  });

  it('markAllRead PATCHes /read-all and unwraps { count }', async () => {
    let hit = false;
    server.use(
      http.patch(`${API}/notifications/read-all`, () => {
        hit = true;
        return HttpResponse.json({ data: { count: 4 }, error: null });
      })
    );

    const { store, notificationApi } = makeStore();
    const res = await store.dispatch(notificationApi.endpoints.markAllRead.initiate());

    expect(hit).toBe(true);
    expect('data' in res ? res.data : undefined).toEqual({ count: 4 });
  });

  it('deleteNotification DELETEs /notifications/:id', async () => {
    let hit = false;
    server.use(
      http.delete(`${API}/notifications/n1`, () => {
        hit = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { store, notificationApi } = makeStore();
    await store.dispatch(notificationApi.endpoints.deleteNotification.initiate('n1'));

    expect(hit).toBe(true);
  });

  it('getPreferences unwraps prefs; updatePreferences PUTs the partial body', async () => {
    let body: unknown;
    server.use(
      http.get(`${API}/notifications/preferences`, () =>
        HttpResponse.json({
          data: {
            emailDigest: true,
            pushEnabled: false,
            smsEnabled: false,
            beforeDueMinutes: 1440,
            afterDueMinutes: 0,
            overdueEnabled: true,
            dailySummaryEnabled: true,
            inboxNudgesEnabled: true,
            streaksEnabled: true,
          },
          error: null,
        })
      ),
      http.put(`${API}/notifications/preferences`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          data: {
            emailDigest: false,
            pushEnabled: false,
            smsEnabled: false,
            beforeDueMinutes: 60,
            afterDueMinutes: 0,
            overdueEnabled: true,
            dailySummaryEnabled: true,
            inboxNudgesEnabled: true,
            streaksEnabled: true,
          },
          error: null,
        });
      })
    );

    const { store, notificationApi } = makeStore();
    const get = await store.dispatch(notificationApi.endpoints.getPreferences.initiate());
    expect(get.data).toEqual(expect.objectContaining({ emailDigest: true, beforeDueMinutes: 1440 }));

    const put = await store.dispatch(
      notificationApi.endpoints.updatePreferences.initiate({ emailDigest: false, beforeDueMinutes: 60 })
    );
    expect(body).toEqual({ emailDigest: false, beforeDueMinutes: 60 });
    expect('data' in put ? put.data : undefined).toEqual(
      expect.objectContaining({ emailDigest: false, beforeDueMinutes: 60 })
    );
  });
});
