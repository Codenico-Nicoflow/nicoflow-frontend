import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { IUser } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { isStatusDismissed } from './googleStatusDismissal';
import CalendarPage from './index';

const API = 'http://localhost:8080/v1';
const EVENTS_URL = `${API}/calendar/google-events`;
const NOW = new Date('2026-08-05T09:00:00Z');

const env = <T,>(data: T) => ({ data, error: null });

const proUser: IUser = {
  id: 'u1',
  email: 'a@b.co',
  firstName: 'A',
  lastName: 'B',
  username: 'ab',
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  imageUrl: '',
  status: 'premium',
};

const task = {
  id: 't1',
  projectId: 'p1',
  title: 'Write the spec',
  status: 'active',
  priority: 'medium',
  scheduledFor: '2026-08-05',
  scheduledTime: '09:00',
  estimatedMinutes: 60,
  displayOrder: 0,
  subtaskCount: 0,
  openSubtaskCount: 0,
  totalFocusSeconds: 0,
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
};

const renderCalendar = () =>
  renderComponent(<CalendarPage now={NOW} />, { store: createMockStore({ auth: { user: proUser } }) });

/** The user's own tasks always resolve; only the Google layer varies per test. */
const withTasks = () => server.use(http.get(`${API}/tasks`, () => HttpResponse.json(env({ items: [task] }))));

describe('Google layer isolation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    withTasks();
  });

  /**
   * The core promise of NIC-1870: Google is a secondary layer, so its failure
   * must never cost the user sight of their own work.
   */
  it('renders every task when the Google request fails outright', async () => {
    server.use(http.get(EVENTS_URL, () => HttpResponse.json({ data: null, error: null }, { status: 500 })));

    renderCalendar();

    expect(await screen.findByTestId('calendar-block-t1')).toBeInTheDocument();
  });

  it('renders every task while the Google request is still hanging', async () => {
    server.use(http.get(EVENTS_URL, () => new Promise(() => {})));

    renderCalendar();

    // Task rendering is neither delayed nor gated on the Google layer.
    expect(await screen.findByTestId('calendar-block-t1')).toBeInTheDocument();
  });

  it('shows the reconnect prompt when the connection is dead', async () => {
    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'disconnected' }))));

    renderCalendar();

    const strip = await screen.findByTestId('google-status-strip');
    expect(strip).toHaveAttribute('data-status', 'disconnected');
    expect(screen.getByTestId('google-status-reconnect')).toBeInTheDocument();
  });

  it('shows an unavailability strip while tasks still render', async () => {
    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'error' }))));

    renderCalendar();

    expect(await screen.findByTestId('google-status-strip')).toHaveAttribute('data-status', 'error');
    expect(screen.getByTestId('calendar-block-t1')).toBeInTheDocument();
  });

  it('shows no strip while the overlay is healthy', async () => {
    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'ok' }))));

    renderCalendar();

    await screen.findByTestId('calendar-block-t1');
    expect(screen.queryByTestId('google-status-strip')).not.toBeInTheDocument();
  });

  it('stays dismissed for the session once waved away', async () => {
    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'error' }))));

    renderCalendar();
    await userEvent.click(await screen.findByTestId('google-status-dismiss'));

    await waitFor(() => expect(screen.queryByTestId('google-status-strip')).not.toBeInTheDocument());
  });

  // Dismissing a transient outage must not silence a dead connection.
  it('still warns about a dead connection after an outage was dismissed', async () => {
    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'error' }))));

    const first = renderCalendar();
    await userEvent.click(await screen.findByTestId('google-status-dismiss'));
    first.unmount();

    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'disconnected' }))));
    renderCalendar();

    expect(await screen.findByTestId('google-status-strip')).toHaveAttribute('data-status', 'disconnected');
  });

  /**
   * A dismissal must not outlive the problem it answered. Without this, a user
   * who waves away today's outage would never be told about a genuinely dead
   * connection weeks later — the failure mode this whole strip exists to
   * prevent.
   */
  it('re-arms the strip after the connection recovers', async () => {
    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'error' }))));

    const failing = renderCalendar();
    await userEvent.click(await screen.findByTestId('google-status-dismiss'));
    failing.unmount();
    expect(isStatusDismissed('error')).toBe(true);

    // A healthy fetch clears the stored record…
    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'ok' }))));
    const healthy = renderCalendar();
    await screen.findByTestId('calendar-block-t1');
    await waitFor(() => expect(isStatusDismissed('error')).toBe(false));
    healthy.unmount();

    // …so the same failure is surfaced again rather than staying silenced.
    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'error' }))));
    renderCalendar();

    expect(await screen.findByTestId('google-status-strip')).toHaveAttribute('data-status', 'error');
  });

  it('never renders token material', async () => {
    server.use(http.get(EVENTS_URL, () => HttpResponse.json(env({ events: [], googleStatus: 'ok' }))));

    const { container } = renderCalendar();
    await screen.findByTestId('calendar-block-t1');

    expect(container.innerHTML).not.toMatch(/refresh[_-]?token/i);
  });
});
