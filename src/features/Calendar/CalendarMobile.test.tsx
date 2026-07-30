import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeTask, makeUser } from '@/mocks/handlers';

import CalendarView from './index';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });
const NOW = new Date(2026, 7, 5, 10, 30); // Wed 2026-08-05

// Timed scheduling is Pro; a free user gets the locked teaser rather than these
// shapes, so every case here signs in as Pro.
const renderCalendar = (initialRoute: string) =>
  renderComponent(<CalendarView now={NOW} />, {
    initialRoute,
    store: createMockStore({ auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } }),
  });

/**
 * useIsMobile reads window.innerWidth and subscribes to matchMedia, so a
 * viewport helper has to set both to be believed.
 */
const setViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    // The hook queries (max-width: 767px); mirror that against the width.
    matches: width < 768,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

const rangeReturns = (tasks: ReturnType<typeof makeTask>[]) =>
  server.use(http.get(`${API}/tasks`, () => HttpResponse.json(env({ items: tasks }))));

const PHONE = 375;
const LANDSCAPE_PHONE = 650; // still under the 768px breakpoint
const DESKTOP = 1280;

beforeEach(() => {
  setViewport(DESKTOP);
});

describe('CalendarView — mobile shapes', () => {
  it('renders the week as an agenda below the breakpoint, with no hour grid', async () => {
    setViewport(PHONE);
    rangeReturns([makeTask({ id: 't1', title: 'Standup', scheduledFor: '2026-08-05', scheduledTime: '09:00' })]);
    renderCalendar('/calendar?view=week&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-agenda')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-grid')).not.toBeInTheDocument();
    expect(screen.getByTestId('calendar-agenda-task-t1')).toBeInTheDocument();
  });

  it('keeps the week as an hour grid above the breakpoint', async () => {
    setViewport(DESKTOP);
    rangeReturns([]);
    renderCalendar('/calendar?view=week&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-grid')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-agenda')).not.toBeInTheDocument();
  });

  it('shows exactly one day column in the mobile hour grid', async () => {
    setViewport(PHONE);
    rangeReturns([]);
    renderCalendar('/calendar?view=day&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-day-2026-08-05')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-day-2026-08-06')).not.toBeInTheDocument();
  });

  it('does not unlock the desktop week grid on a landscape phone', async () => {
    // ~650px wide and ~350px tall is worse for an hour grid, not better — the
    // breakpoint must win over the orientation.
    setViewport(LANDSCAPE_PHONE);
    rangeReturns([makeTask({ id: 't1', scheduledFor: '2026-08-05', scheduledTime: '09:00' })]);
    renderCalendar('/calendar?view=week&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-agenda')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-grid')).not.toBeInTheDocument();
  });

  it('collapses empty days out of the agenda', async () => {
    setViewport(PHONE);
    rangeReturns([makeTask({ id: 't1', scheduledFor: '2026-08-05', scheduledTime: '09:00' })]);
    renderCalendar('/calendar?view=week&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-agenda-day-2026-08-05')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-agenda-day-2026-08-06')).not.toBeInTheDocument();
  });

  it('labels an untimed agenda row as all-day rather than leaving a blank gutter', async () => {
    setViewport(PHONE);
    rangeReturns([makeTask({ id: 't1', title: 'Read the RFC', scheduledFor: '2026-08-05', scheduledTime: null })]);
    renderCalendar('/calendar?view=week&date=2026-08-05');

    const row = await screen.findByTestId('calendar-agenda-task-t1');
    expect(row).toHaveTextContent('All day');
  });
});

describe('CalendarView — month density', () => {
  it('shows a count-bearing density indicator per populated day', async () => {
    setViewport(PHONE);
    rangeReturns([
      makeTask({ id: 'a', scheduledFor: '2026-08-05', scheduledTime: '09:00' }),
      makeTask({ id: 'b', scheduledFor: '2026-08-05', scheduledTime: '10:00' }),
    ]);
    renderCalendar('/calendar?view=month&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-month')).toBeInTheDocument());
    expect(screen.getByTestId('calendar-month-density-2026-08-05')).toBeInTheDocument();
    // Empty days carry no density marker at all.
    expect(screen.queryByTestId('calendar-month-density-2026-08-07')).not.toBeInTheDocument();
  });

  it('drills into the day view when a cell is tapped', async () => {
    const user = userEvent.setup();
    setViewport(PHONE);
    rangeReturns([]);
    renderCalendar('/calendar?view=month&date=2026-08-05');

    await user.click(await screen.findByTestId('calendar-month-cell-2026-08-12'));

    await waitFor(() => expect(window.location.search).toContain('view=day'));
    expect(window.location.search).toContain('date=2026-08-12');
  });

  it('pads the month to whole weeks so the grid stays rectangular', async () => {
    setViewport(PHONE);
    rangeReturns([]);
    renderCalendar('/calendar?view=month&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-month')).toBeInTheDocument());
    // August 2026 starts on a Saturday, so the grid opens in late July.
    expect(screen.getByTestId('calendar-month-cell-2026-07-27')).toBeInTheDocument();
  });
});

describe('CalendarView — per-view skeletons', () => {
  // Holding the request open is what keeps the component in its loading state.
  const pending = () => server.use(http.get(`${API}/tasks`, () => new Promise(() => {})));

  it('uses the month skeleton for the month view', async () => {
    setViewport(PHONE);
    pending();
    renderCalendar('/calendar?view=month&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-skeleton-month')).toBeInTheDocument());
  });

  it('uses the agenda skeleton for the mobile week view', async () => {
    setViewport(PHONE);
    pending();
    renderCalendar('/calendar?view=week&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-skeleton-agenda')).toBeInTheDocument());
  });

  it('uses the grid skeleton for the desktop week view', async () => {
    setViewport(DESKTOP);
    pending();
    renderCalendar('/calendar?view=week&date=2026-08-05');

    await waitFor(() => expect(screen.getByTestId('calendar-skeleton-grid')).toBeInTheDocument());
  });
});

describe('CalendarView — layout safety', () => {
  it('confines horizontal scrolling to the grid, never the page body', async () => {
    setViewport(PHONE);
    rangeReturns([]);
    renderCalendar('/calendar?view=day&date=2026-08-05');

    const grid = await screen.findByTestId('calendar-grid');
    // The scroll container is the grid itself; below md its inner min-width is
    // not applied, so even that box has nothing to scroll.
    expect(grid).toHaveClass('overflow-x-auto');
    expect(grid.firstElementChild).toHaveClass('md:min-w-[600px]');
    expect(grid.firstElementChild).not.toHaveClass('min-w-[600px]');
  });
});
