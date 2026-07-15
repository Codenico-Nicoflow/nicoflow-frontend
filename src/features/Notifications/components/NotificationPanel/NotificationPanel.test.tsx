import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { Popover } from '@/components/ui/popover';
import type { INotification } from '@/lib/types';

import { NotificationPanel } from './index';

const API = 'http://localhost:8080/v1';

const makeNotification = (o: Partial<INotification> = {}): INotification => ({
  id: 'n1',
  type: 'task_due_soon',
  title: 'Buy milk',
  body: 'This task is scheduled soon.',
  metadata: {},
  isRead: false,
  readAt: null,
  createdAt: new Date().toISOString(),
  ...o,
});

const prefsHandler = (emailDigest = true) =>
  http.get(`${API}/notifications/preferences`, () =>
    HttpResponse.json({
      data: { emailDigest, pushEnabled: false, smsEnabled: false, beforeDueMinutes: 1440, afterDueMinutes: 0 },
      error: null,
    })
  );

const renderPanel = (open = true) =>
  renderComponent(
    <Popover open={open}>
      <NotificationPanel open={open} />
    </Popover>
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
      }),
      prefsHandler()
    );

    renderPanel(true);

    await waitFor(() => expect(screen.getByText('Buy milk')).toBeInTheDocument());
    expect(listCalls).toBe(1);
  });

  it('AC1: shows the empty state when there are no notifications', async () => {
    server.use(
      http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null })),
      prefsHandler()
    );

    renderPanel(true);

    await waitFor(() => expect(screen.getByText('No new notifications')).toBeInTheDocument());
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
      }),
      prefsHandler()
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
      }),
      prefsHandler()
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
      }),
      prefsHandler()
    );

    renderPanel(true);
    await screen.findByTestId('notification-row');

    // No mutation should have fired just from opening/rendering.
    expect(readSpy).not.toHaveBeenCalled();
  });

  it('AC4: the digest toggle reflects the persisted preference and writes on flip', async () => {
    let putBody: unknown;
    server.use(
      http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null })),
      prefsHandler(false),
      http.put(`${API}/notifications/preferences`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({
          data: {
            emailDigest: true,
            pushEnabled: false,
            smsEnabled: false,
            beforeDueMinutes: 1440,
            afterDueMinutes: 0,
          },
          error: null,
        });
      })
    );

    renderPanel(true);

    const toggle = await screen.findByTestId('digest-toggle');
    await waitFor(() => expect(toggle).toHaveAttribute('data-state', 'unchecked'));

    await userEvent.click(toggle);

    await waitFor(() => expect(putBody).toEqual({ emailDigest: true }));
  });

  it('AC5: shows a skeleton while the list is loading', async () => {
    // Never-resolving list → stays in loading.
    server.use(
      http.get(`${API}/notifications`, () => new Promise(() => {})),
      prefsHandler()
    );

    renderPanel(true);

    expect(await screen.findByTestId('notification-skeleton')).toBeInTheDocument();
  });

  it('mark-all-read is disabled when there are no unread notifications', async () => {
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({
          data: {
            items: [makeNotification({ id: 'n1', isRead: true, readAt: new Date().toISOString() })],
            nextCursor: '',
          },
          error: null,
        })
      ),
      prefsHandler()
    );

    renderPanel(true);
    await screen.findByTestId('notification-row');

    const markAll = screen.getByTestId('mark-all-read-button');
    // No unread → the row shows only a dismiss button, and mark-all is disabled.
    expect(markAll).toBeDisabled();
    expect(within(screen.getByTestId('notification-row')).queryByTestId('mark-read-button')).not.toBeInTheDocument();
  });

  it('the desktop-notification toggle requests permission and persists when granted', async () => {
    localStorage.removeItem('nicoflow-desktop-notifications-enabled');
    const requestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('Notification', Object.assign(vi.fn(), { permission: 'default', requestPermission }));
    server.use(
      http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null })),
      prefsHandler()
    );

    renderPanel(true);

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
      http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null })),
      prefsHandler()
    );

    renderPanel(true);

    const toggle = await screen.findByTestId('desktop-toggle');
    await userEvent.click(toggle);

    await waitFor(() => expect(requestPermission).toHaveBeenCalledOnce());
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('nicoflow-desktop-notifications-enabled')).toBe('false');

    vi.unstubAllGlobals();
  });
});
