import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskStatus } from '@/lib/types';
import { makeTask, mockUser } from '@/mocks/handlers';

import { MAX_MONTH_CHIPS, MONTH_GRID_DAYS } from './data';
import CalendarView from './index';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

// 22:30 UTC on the 5th is already the 6th in Tokyo — the seam AC4 turns on.
const NOW = new Date('2026-08-05T22:30:00Z');
const MONTH_ROUTE = '/calendar?view=month&date=2026-08-05';

const setViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
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

// Timed scheduling is Pro; a free user sees the locked teaser instead of the
// month grid, so these cases sign in as Pro.
const proStore = (timezone?: string) =>
  createMockStore({
    auth: { user: { ...mockUser, status: 'premium', ...(timezone ? { timezone } : {}) }, token: 't', isLoading: false },
  });

const renderMonth = (options?: { timezone?: string }) =>
  renderComponent(<CalendarView now={NOW} />, {
    initialRoute: MONTH_ROUTE,
    store: proStore(options?.timezone),
  });

const DESKTOP = 1280;
const PHONE = 375;

beforeEach(() => {
  setViewport(DESKTOP);
});

describe('CalendarView — desktop month grid', () => {
  it('renders six complete weeks including the adjacent-month padding', async () => {
    rangeReturns([makeTask({ id: 'a', scheduledFor: '2026-08-05', scheduledTime: '09:00' })]);
    renderMonth();

    const grid = await screen.findByTestId('calendar-month-grid');
    const cells = within(grid).getAllByTestId(/^calendar-month-cell-/);
    expect(cells).toHaveLength(MONTH_GRID_DAYS);
    // August 2026 starts on a Saturday, so the grid opens in late July and
    // trails into September.
    expect(screen.getByTestId('calendar-month-cell-2026-07-27')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-month-cell-2026-09-06')).toBeInTheDocument();
  });

  it('marks the padding days as outside the anchored month', async () => {
    rangeReturns([makeTask({ id: 'a', scheduledFor: '2026-08-05' })]);
    renderMonth();

    await screen.findByTestId('calendar-month-grid');
    expect(screen.getByTestId('calendar-month-cell-2026-07-27')).toHaveAttribute('data-outside', 'true');
    expect(screen.getByTestId('calendar-month-cell-2026-08-05')).not.toHaveAttribute('data-outside');
  });

  it('keeps the density dots on mobile rather than the desktop chips', async () => {
    setViewport(PHONE);
    rangeReturns([makeTask({ id: 'a', title: 'Standup', scheduledFor: '2026-08-05', scheduledTime: '09:00' })]);
    renderMonth();

    await waitFor(() => expect(screen.getByTestId('calendar-month')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-month-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('calendar-month-chip-a')).not.toBeInTheDocument();
  });
});

describe('CalendarView — month chip overflow', () => {
  const fiveOnOneDay = () =>
    Array.from({ length: 5 }, (_, index) =>
      makeTask({
        id: `t${index}`,
        title: `Task ${index}`,
        scheduledFor: '2026-08-05',
        scheduledTime: `0${index + 8}:00`,
      })
    );

  it('shows the capped chips plus a count for the remainder', async () => {
    rangeReturns(fiveOnOneDay());
    renderMonth();

    const cell = await screen.findByTestId('calendar-month-cell-2026-08-05');
    expect(within(cell).getAllByTestId(/^calendar-month-chip-/)).toHaveLength(MAX_MONTH_CHIPS);
    expect(screen.getByTestId('calendar-month-overflow-2026-08-05')).toHaveTextContent('+2 more');
  });

  it('renders no overflow affordance when everything fits', async () => {
    rangeReturns(fiveOnOneDay().slice(0, MAX_MONTH_CHIPS));
    renderMonth();

    const cell = await screen.findByTestId('calendar-month-cell-2026-08-05');
    expect(within(cell).getAllByTestId(/^calendar-month-chip-/)).toHaveLength(MAX_MONTH_CHIPS);
    expect(screen.queryByTestId('calendar-month-overflow-2026-08-05')).not.toBeInTheDocument();
  });
});

describe('CalendarView — month drill-through', () => {
  it('navigates to the day view and updates the URL when a cell is clicked', async () => {
    const user = userEvent.setup();
    rangeReturns([]);
    renderMonth();

    await user.click(await screen.findByTestId('calendar-month-cell-2026-08-12'));

    await waitFor(() => expect(window.location.search).toContain('view=day'));
    expect(window.location.search).toContain('date=2026-08-12');
  });

  it('drills through on keyboard activation of the day control', async () => {
    // The cell itself is not focusable — the day number is the real control, so
    // the chips inside it stay reachable rather than nested in a button.
    const user = userEvent.setup();
    rangeReturns([]);
    renderMonth();

    const open = await screen.findByTestId('calendar-month-open-2026-08-12');
    open.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(window.location.search).toContain('view=day'));
    expect(window.location.search).toContain('date=2026-08-12');
  });

  it('keeps the chips out of a nested button so they stay reachable', async () => {
    rangeReturns([makeTask({ id: 'a', title: 'Design review', scheduledFor: '2026-08-05', scheduledTime: '09:00' })]);
    renderMonth();

    const chip = await screen.findByTestId('calendar-month-chip-a');
    expect(chip.closest('button')).toBe(chip);
  });

  it('opens the task rather than the day when a chip is clicked', async () => {
    const user = userEvent.setup();
    rangeReturns([makeTask({ id: 'a', title: 'Design review', scheduledFor: '2026-08-05', scheduledTime: '09:00' })]);
    renderMonth();

    await user.click(await screen.findByTestId('calendar-month-chip-a'));

    // The dialog took the click; the URL stayed on the month.
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(window.location.search).toContain('view=month');
  });
});

describe('CalendarView — month chip content', () => {
  it('shows a time on a timed chip and none on an untimed one', async () => {
    rangeReturns([
      makeTask({ id: 'timed', title: 'Standup', scheduledFor: '2026-08-05', scheduledTime: '09:00' }),
      makeTask({ id: 'untimed', title: 'Read the RFC', scheduledFor: '2026-08-05', scheduledTime: null }),
    ]);
    renderMonth();

    expect(await screen.findByTestId('calendar-chip-time-timed')).toHaveTextContent('09:00');
    expect(screen.queryByTestId('calendar-chip-time-untimed')).not.toBeInTheDocument();
    expect(screen.getByTestId('calendar-month-chip-untimed')).toHaveTextContent('Read the RFC');
  });

  it('keeps completed work on its real day rather than hiding it', async () => {
    // A calendar is a record, not a to-do list — a done task still happened.
    rangeReturns([makeTask({ id: 'done', title: 'Shipped it', scheduledFor: '2026-08-05', status: TaskStatus.DONE })]);
    renderMonth();

    expect(await screen.findByTestId('calendar-month-chip-done')).toHaveTextContent('Shipped it');
  });
});

describe('CalendarView — today in the account timezone', () => {
  it('marks the account day, not the browser day', async () => {
    rangeReturns([makeTask({ id: 'a', scheduledFor: '2026-08-05' })]);
    renderMonth({ timezone: 'Asia/Tokyo' });

    // 22:30 UTC on the 5th is 07:30 on the 6th in Tokyo.
    await waitFor(() => expect(screen.getByTestId('calendar-month-cell-2026-08-06')).toHaveAttribute('data-today'));
    expect(screen.getByTestId('calendar-month-cell-2026-08-05')).not.toHaveAttribute('data-today');
  });

  it('marks the earlier day for an account behind UTC', async () => {
    rangeReturns([makeTask({ id: 'a', scheduledFor: '2026-08-05' })]);
    renderMonth({ timezone: 'America/New_York' });

    await waitFor(() => expect(screen.getByTestId('calendar-month-cell-2026-08-05')).toHaveAttribute('data-today'));
    expect(screen.getByTestId('calendar-month-cell-2026-08-06')).not.toHaveAttribute('data-today');
  });
});

describe('CalendarView — empty month', () => {
  it('shows an empty state rather than a bare grid or a spinner', async () => {
    rangeReturns([]);
    renderMonth();

    expect(await screen.findByTestId('calendar-month-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-skeleton-month')).not.toBeInTheDocument();
  });

  it('keeps the six-week grid navigable while empty', async () => {
    // Collapsing the grid would jump the layout and strip the drill-through on
    // exactly the month a user is most likely to be planning into.
    rangeReturns([]);
    renderMonth();

    const grid = await screen.findByTestId('calendar-month-grid');
    expect(within(grid).getAllByTestId(/^calendar-month-cell-/)).toHaveLength(MONTH_GRID_DAYS);
  });

  it('shows the month skeleton while the range is still in flight', async () => {
    server.use(http.get(`${API}/tasks`, () => new Promise(() => {})));
    renderMonth();

    await waitFor(() => expect(screen.getByTestId('calendar-skeleton-month')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-month-empty')).not.toBeInTheDocument();
  });
});
