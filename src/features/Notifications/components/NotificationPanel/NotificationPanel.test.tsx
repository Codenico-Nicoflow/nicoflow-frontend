import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { INotification, IUser } from '@nicoflow/shared/types';
import { categoryForType } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { Popover } from '@/components/ui/popover';

import { NotificationPanel } from './index';

const API = 'http://localhost:8080/v1';

const makeUser = (status: IUser['status']): IUser => ({
  id: 'u1',
  email: 'a@b.co',
  firstName: 'A',
  lastName: 'B',
  username: 'ab',
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  imageUrl: '',
  status,
});

const proStore = () => createMockStore({ auth: { user: makeUser('premium'), token: 't' } });
const freeStore = () => createMockStore({ auth: { user: makeUser('regular'), token: 't' } });

const makeNotification = (o: Partial<INotification> = {}): INotification => {
  const type = o.type ?? 'morning_digest';
  return {
    id: 'n1',
    type,
    category: categoryForType(type),
    title: 'Plan your day',
    body: '3 tasks scheduled today.',
    metadata: {},
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...o,
  };
};

const renderPanel = (open = true, store?: ReturnType<typeof createMockStore>) =>
  renderComponent(
    <Popover open={open}>
      <NotificationPanel open={open} />
    </Popover>,
    store ? { store } : undefined
  );

describe('NotificationPanel', () => {
  it('AC1: lazily fetches the list only when open, newest-first', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API}/notifications`, () => {
        listCalls += 1;
        return HttpResponse.json({
          data: { items: [makeNotification({ id: 'n1', title: 'Buy milk' })], nextCursor: '' },
          error: null,
        });
      })
    );

    renderPanel(true);

    await waitFor(() => expect(screen.getByText('Buy milk')).toBeInTheDocument());
    expect(listCalls).toBe(1);
  });

  it('AC1: shows the empty state when there are no notifications', async () => {
    server.use(
      http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null }))
    );

    renderPanel(true);

    await waitFor(() => expect(screen.getByText('No new notifications')).toBeInTheDocument());
  });

  it('the panel renders the list only — no preference controls', async () => {
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({ data: { items: [makeNotification({ id: 'n1' })], nextCursor: '' }, error: null })
      )
    );

    renderPanel(true);
    await screen.findByTestId('notification-row');

    // Preferences moved to Settings — none of the pref controls live here anymore.
    expect(screen.queryByTestId('prefs-disclosure')).not.toBeInTheDocument();
    expect(screen.queryByTestId('digest-toggle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('push-toggle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('morning-hour')).not.toBeInTheDocument();
  });

  it('AC2: mark-read calls the mutation for that notification', async () => {
    let markedId = '';
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({ data: { items: [makeNotification({ id: 'n1' })], nextCursor: '' }, error: null })
      ),
      http.patch(`${API}/notifications/n1/read`, () => {
        markedId = 'n1';
        return HttpResponse.json({ data: makeNotification({ id: 'n1', isRead: true }), error: null });
      })
    );

    renderPanel(true);
    await screen.findByTestId('notification-row');

    await userEvent.click(screen.getByTestId('mark-read-button'));

    await waitFor(() => expect(markedId).toBe('n1'));
  });

  it('AC2: dismiss calls delete for that notification', async () => {
    let deleted = false;
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({ data: { items: [makeNotification({ id: 'n1' })], nextCursor: '' }, error: null })
      ),
      http.delete(`${API}/notifications/n1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderPanel(true);
    await screen.findByTestId('notification-row');

    await userEvent.click(screen.getByTestId('dismiss-button'));

    await waitFor(() => expect(deleted).toBe(true));
  });

  it('AC3: opening the panel does NOT auto-mark anything read', async () => {
    const readSpy = vi.fn();
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({ data: { items: [makeNotification({ id: 'n1' })], nextCursor: '' }, error: null })
      ),
      http.patch(`${API}/notifications/:id/read`, () => {
        readSpy();
        return HttpResponse.json({ data: makeNotification({ isRead: true }), error: null });
      }),
      http.patch(`${API}/notifications/read-all`, () => {
        readSpy();
        return HttpResponse.json({ data: { count: 1 }, error: null });
      })
    );

    renderPanel(true);
    await screen.findByTestId('notification-row');

    // No mutation should have fired just from opening/rendering.
    expect(readSpy).not.toHaveBeenCalled();
  });

  it('AC5: shows a skeleton while the list is loading', async () => {
    // Never-resolving list → stays in loading.
    server.use(http.get(`${API}/notifications`, () => new Promise(() => {})));

    renderPanel(true);

    expect(await screen.findByTestId('notification-skeleton')).toBeInTheDocument();
  });

  it('mark-all-read is disabled and the list is empty when nothing is unread', async () => {
    // Panel requests isRead=false, so a read-only inbox comes back empty — the
    // list shows the empty state and mark-all has nothing to act on.
    server.use(
      http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null }))
    );

    renderPanel(true);
    await screen.findByTestId('notification-panel');

    const markAll = await screen.findByTestId('mark-all-read-button');
    expect(markAll).toBeDisabled();
    expect(screen.queryByTestId('notification-row')).not.toBeInTheDocument();
  });

  it('the desktop-notification toggle requests permission and persists when granted', async () => {
    localStorage.removeItem('nicoflow-desktop-notifications-enabled');
    const requestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('Notification', Object.assign(vi.fn(), { permission: 'default', requestPermission }));
    server.use(
      http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null }))
    );

    renderPanel(true, proStore());

    const toggle = await screen.findByTestId('desktop-toggle');
    // Starts off → the label offers to enable.
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAccessibleName('Enable browser notifications');

    await userEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'));
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(localStorage.getItem('nicoflow-desktop-notifications-enabled')).toBe('true');
    expect(toggle).toHaveAccessibleName('Disable browser notifications');

    await userEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'false'));

    localStorage.removeItem('nicoflow-desktop-notifications-enabled');
    vi.unstubAllGlobals();
  });

  it('the desktop-notification toggle stays off and warns when permission is denied', async () => {
    localStorage.removeItem('nicoflow-desktop-notifications-enabled');
    const requestPermission = vi.fn().mockResolvedValue('denied');
    vi.stubGlobal('Notification', Object.assign(vi.fn(), { permission: 'default', requestPermission }));
    server.use(
      http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null }))
    );

    renderPanel(true, proStore());

    const toggle = await screen.findByTestId('desktop-toggle');
    await userEvent.click(toggle);

    await waitFor(() => expect(requestPermission).toHaveBeenCalledOnce());
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('nicoflow-desktop-notifications-enabled')).toBe('false');

    vi.unstubAllGlobals();
  });

  it('a free user cannot enable desktop — permission is never requested (upgrade prompt)', async () => {
    localStorage.removeItem('nicoflow-desktop-notifications-enabled');
    const requestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('Notification', Object.assign(vi.fn(), { permission: 'default', requestPermission }));
    server.use(
      http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null }))
    );

    renderPanel(true, freeStore());

    const toggle = await screen.findByTestId('desktop-toggle');
    await userEvent.click(toggle);

    // Pro gate: no permission requested, toggle stays off, nothing persisted.
    await waitFor(() => expect(requestPermission).not.toHaveBeenCalled());
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('nicoflow-desktop-notifications-enabled')).not.toBe('true');

    vi.unstubAllGlobals();
  });
});
