import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { IUser } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { NotificationsCard } from './NotificationsCard';

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

const prefsHandler = (overrides: Record<string, unknown> = {}) =>
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
        morningHour: 8,
        eveningHour: 20,
        ...overrides,
      },
      error: null,
    })
  );

const renderCard = (store = proStore()) => renderComponent(<NotificationsCard />, { store });

describe('NotificationsCard', () => {
  it('shows a skeleton while preferences load', async () => {
    server.use(http.get(`${API}/notifications/preferences`, () => new Promise(() => {})));

    renderCard();

    expect(await screen.findByTestId('notifications-skeleton')).toBeInTheDocument();
  });

  it('AC: renders emailDigest + the four family toggles', async () => {
    server.use(prefsHandler());

    renderCard();

    await screen.findByTestId('pref-email-digest');
    for (const id of ['pref-overdue', 'pref-daily-summary', 'pref-inbox', 'pref-streaks']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  it('AC: does not surface SMS or lead-time controls', async () => {
    server.use(prefsHandler());

    renderCard();
    await screen.findByTestId('pref-overdue');

    expect(screen.queryByText(/sms/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/lead time|minutes before|minutes after/i)).not.toBeInTheDocument();
  });

  it('AC: a family switch reads the preference and auto-saves on toggle', async () => {
    let putBody: unknown;
    server.use(
      prefsHandler(),
      http.put(`${API}/notifications/preferences`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ data: {}, error: null });
      })
    );

    renderCard();

    const overdue = await screen.findByTestId('pref-overdue');
    await waitFor(() => expect(overdue).toHaveAttribute('data-state', 'checked'));

    await userEvent.click(overdue);
    await waitFor(() => expect(putBody).toEqual({ overdueEnabled: false }));
  });

  it('AC: the morning-hour picker reflects the preference and writes on change', async () => {
    let putBody: unknown;
    server.use(
      prefsHandler(),
      http.put(`${API}/notifications/preferences`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ data: {}, error: null });
      })
    );

    renderCard();

    const morning = await screen.findByTestId('morning-hour');
    await waitFor(() => expect(morning).toHaveTextContent('8:00 AM'));

    await userEvent.click(morning);
    await userEvent.click(await screen.findByRole('option', { name: '7:00 AM' }));

    await waitFor(() => expect(putBody).toEqual({ morningHour: 7 }));
  });

  it('AC: Pro-only families are locked for a free user; overdue stays usable', async () => {
    server.use(prefsHandler());

    renderCard(freeStore());

    await waitFor(() => expect(screen.getByTestId('pref-overdue')).not.toBeDisabled());
    expect(screen.getByTestId('pref-daily-summary')).toBeDisabled();
    expect(screen.getByTestId('pref-inbox')).toBeDisabled();
    expect(screen.getByTestId('pref-streaks')).toBeDisabled();
  });

  it('AC: emailDigest is a locked Pro row for a free user (upgrade CTA, no write)', async () => {
    let putCalled = false;
    server.use(
      prefsHandler(),
      http.put(`${API}/notifications/preferences`, () => {
        putCalled = true;
        return HttpResponse.json({ data: {}, error: null });
      })
    );

    renderCard(freeStore());

    const digest = await screen.findByTestId('pref-email-digest');
    // Locked → switch is disabled and shows off regardless of the stored value.
    expect(digest).toBeDisabled();
    expect(digest).toHaveAttribute('data-state', 'unchecked');
    expect(putCalled).toBe(false);
  });

  it('AC: emailDigest is a live toggle for a Pro user and auto-saves', async () => {
    let putBody: unknown;
    server.use(
      prefsHandler({ emailDigest: false }),
      http.put(`${API}/notifications/preferences`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ data: {}, error: null });
      })
    );

    renderCard(proStore());

    const digest = await screen.findByTestId('pref-email-digest');
    await waitFor(() => expect(digest).toHaveAttribute('data-state', 'unchecked'));

    await userEvent.click(digest);
    await waitFor(() => expect(putBody).toEqual({ emailDigest: true }));
  });

  it('push row appears after the five TOGGLE_META rows in the card', async () => {
    // Stub a full browser Push environment so PushToggle renders instead of returning null.
    const registration = { pushManager: { subscribe: vi.fn(), getSubscription: vi.fn().mockResolvedValue(null) } };
    vi.stubGlobal('PushManager', function PushManager() {});
    vi.stubGlobal('Notification', { permission: 'default', requestPermission: vi.fn() });
    vi.stubGlobal('navigator', {
      userAgent: 'test-agent',
      serviceWorker: {
        register: vi.fn().mockResolvedValue(registration),
        ready: Promise.resolve(registration),
        getRegistration: vi.fn().mockResolvedValue(undefined),
      },
    });
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BFN5TESTKEY0123456789abcdefABCDEF-_');

    server.use(prefsHandler());
    renderCard(proStore());

    // All five standard toggles must render first.
    const streaks = await screen.findByTestId('pref-streaks');
    const pushRow = await screen.findByTestId('push-toggle-row');

    // The push row must appear AFTER the streaks row in DOM order.
    expect(streaks.compareDocumentPosition(pushRow)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
