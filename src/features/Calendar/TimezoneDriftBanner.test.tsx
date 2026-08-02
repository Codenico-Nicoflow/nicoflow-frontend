import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeTask, makeUser } from '@/mocks/handlers';

import CalendarView from './index';
import { isDriftDismissed } from './timezoneDismissal';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

const NOW = new Date('2026-08-05T09:30:00Z');

// The browser zone comes from Intl, which jsdom resolves from TZ. Stubbing the
// resolver keeps the drift deterministic without stubbing the whole of Intl,
// which the offset maths still needs to work for real.
const browserZoneIs = (timezone: string) => {
  const actual = Intl.DateTimeFormat;
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    ((locale?: string, options?: Intl.DateTimeFormatOptions) =>
      new actual(
        locale,
        options?.timeZone ? options : { ...options, timeZone: timezone }
      )) as typeof Intl.DateTimeFormat
  );
};

/** Timed scheduling is Pro; a free user gets the teaser instead of the grid. */
const renderCalendar = (timezone: string) =>
  renderComponent(<CalendarView now={NOW} />, {
    store: createMockStore({
      auth: { user: makeUser({ status: 'premium', timezone }), token: 't', isLoading: false },
    }),
  });

describe('TimezoneDriftBanner', () => {
  beforeEach(() => {
    window.localStorage.clear();
    server.use(http.get(`${API}/tasks`, () => HttpResponse.json(env({ items: [makeTask({ id: 'a' })] }))));
  });

  it('stays hidden when the browser matches the account zone', async () => {
    browserZoneIs('Asia/Jerusalem');
    renderCalendar('Asia/Jerusalem');

    await waitFor(() => expect(screen.getByTestId('calendar-grid')).toBeInTheDocument());
    expect(screen.queryByTestId('timezone-drift-banner')).not.toBeInTheDocument();
  });

  it('stays hidden for two zone names sharing one wall clock', async () => {
    browserZoneIs('Europe/Paris');
    renderCalendar('Europe/Berlin');

    await waitFor(() => expect(screen.getByTestId('calendar-grid')).toBeInTheDocument());
    expect(screen.queryByTestId('timezone-drift-banner')).not.toBeInTheDocument();
  });

  it('names both zones on a mismatch', async () => {
    browserZoneIs('America/New_York');
    renderCalendar('Asia/Jerusalem');

    const banner = await screen.findByTestId('timezone-drift-banner');
    expect(banner).toHaveTextContent('Asia/Jerusalem');
    expect(banner).toHaveTextContent('America/New York');
  });

  it('closes on dismiss and leaves the stored zone untouched', async () => {
    const user = userEvent.setup();
    let patched = false;
    server.use(
      http.patch(`${API}/users/me`, () => {
        patched = true;
        return HttpResponse.json(env(makeUser()));
      })
    );

    browserZoneIs('America/New_York');
    renderCalendar('Asia/Jerusalem');

    await user.click(await screen.findByTestId('timezone-drift-dismiss'));

    await waitFor(() => expect(screen.queryByTestId('timezone-drift-banner')).not.toBeInTheDocument());
    expect(patched).toBe(false);
    expect(isDriftDismissed('Asia/Jerusalem', 'America/New_York')).toBe(true);
  });

  it('sends the browser zone on an explicit update', async () => {
    const user = userEvent.setup();
    let body: { timezone?: string } | undefined;
    server.use(
      http.patch(`${API}/users/me`, async ({ request }) => {
        body = (await request.json()) as { timezone?: string };
        return HttpResponse.json(env(makeUser({ timezone: 'America/New_York' })));
      })
    );

    browserZoneIs('America/New_York');
    renderCalendar('Asia/Jerusalem');

    await user.click(await screen.findByTestId('timezone-drift-update'));

    await waitFor(() => expect(body).toEqual({ timezone: 'America/New_York' }));
    await waitFor(() => expect(screen.queryByTestId('timezone-drift-banner')).not.toBeInTheDocument());
  });

  it('keeps the banner open when the update is refused', async () => {
    const user = userEvent.setup();
    server.use(http.patch(`${API}/users/me`, () => HttpResponse.json(env(null), { status: 422 })));

    browserZoneIs('America/New_York');
    renderCalendar('Asia/Jerusalem');

    await user.click(await screen.findByTestId('timezone-drift-update'));

    // A refused write leaves the drift unresolved, so the user can still dismiss.
    await waitFor(() => expect(screen.getByTestId('timezone-drift-banner')).toBeInTheDocument());
  });

  it('does not prompt again for a pair already dismissed', async () => {
    browserZoneIs('America/New_York');
    window.localStorage.setItem('nicoflow-tz-drift-dismissed', 'Asia/Jerusalem>America/New_York');
    renderCalendar('Asia/Jerusalem');

    await waitFor(() => expect(screen.getByTestId('calendar-grid')).toBeInTheDocument());
    expect(screen.queryByTestId('timezone-drift-banner')).not.toBeInTheDocument();
  });

  it('prompts again when the browser moves to a new zone', async () => {
    browserZoneIs('Asia/Tokyo');
    window.localStorage.setItem('nicoflow-tz-drift-dismissed', 'Asia/Jerusalem>America/New_York');
    renderCalendar('Asia/Jerusalem');

    expect(await screen.findByTestId('timezone-drift-banner')).toBeInTheDocument();
  });

  it('stays hidden for an account with no stored zone', async () => {
    // Nothing to drift from — a profile predating the field has no authoritative
    // zone to defend, so prompting would be asking about nothing.
    browserZoneIs('America/New_York');
    renderCalendar('');

    await waitFor(() => expect(screen.getByTestId('calendar-grid')).toBeInTheDocument());
    expect(screen.queryByTestId('timezone-drift-banner')).not.toBeInTheDocument();
  });
});
