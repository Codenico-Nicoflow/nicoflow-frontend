import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { makeHabit, makeHabitCell } from '@/mocks/handlers';

import { HabitDetailView } from './HabitDetailView';

const API = 'http://localhost:8080/v1';

// Cells oldest-first, matching the server, so the tail is the recent end.
const window14 = (satisfiedDates: string[] = []) =>
  Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 7, 5 - (13 - i)));
    const date = d.toISOString().slice(0, 10);
    return makeHabitCell({ date, satisfied: satisfiedDates.includes(date) });
  });

const renderDetail = (habit = makeHabit({ id: 'h1', cells: window14() })) => {
  server.use(http.get(`${API}/habits/h1`, () => HttpResponse.json({ data: habit, error: null })));

  return renderComponent(
    <Routes>
      <Route path="/habits/:habitId" element={<HabitDetailView />} />
    </Routes>,
    { initialRoute: '/habits/h1' }
  );
};

describe('HabitDetailView', () => {
  it('shows the habit with its streak stats', async () => {
    renderDetail(makeHabit({ id: 'h1', name: 'Read', currentStreak: 5, longestStreak: 12, cells: window14() }));

    expect(await screen.findByText('Read')).toBeInTheDocument();
    expect(screen.getByTestId('habit-detail-current')).toHaveTextContent('5 days');
    expect(screen.getByTestId('habit-detail-longest')).toHaveTextContent('12 days');
  });

  // Unscheduled days are excluded from both sides of the ratio: a Mon/Wed/Fri
  // habit that never misses is at 100%, not 43%.
  it('computes completion over scheduled days only', async () => {
    const cells = [
      makeHabitCell({ date: '2026-08-01', scheduled: true, satisfied: true }),
      makeHabitCell({ date: '2026-08-02', scheduled: false, satisfied: false }),
      makeHabitCell({ date: '2026-08-03', scheduled: true, satisfied: true }),
    ];

    renderDetail(makeHabit({ id: 'h1', cells }));

    expect(await screen.findByTestId('habit-detail-rate')).toHaveTextContent('100%');
  });

  it('renders the interactive ribbon', async () => {
    renderDetail();

    expect(await screen.findByTestId('habit-ribbon-interactive')).toBeInTheDocument();
  });

  // The point of the whole detail page: a forgotten day can be corrected where
  // the user can see the gap.
  it('backfills a past day by tapping its cell', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post(`${API}/habits/h1/check-in`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeHabit({ id: 'h1' }), error: null });
      })
    );

    renderDetail();

    // The day before today sits inside the 7-day window.
    const cell = await screen.findByTestId('habit-cell-2026-08-04');
    await user.click(cell);

    await waitFor(() => expect(body).toEqual({ date: '2026-08-04' }));
  });

  it('undoes a past day that was already satisfied', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.delete(`${API}/habits/h1/check-in`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeHabit({ id: 'h1' }), error: null });
      })
    );

    renderDetail(makeHabit({ id: 'h1', cells: window14(['2026-08-04']) }));

    await user.click(await screen.findByTestId('habit-cell-2026-08-04'));

    await waitFor(() => expect(body).toEqual({ date: '2026-08-04' }));
  });

  // Days outside the backfill window are still drawn — the history is the point
  // — but they are not controls.
  it('leaves days outside the backfill window non-interactive', async () => {
    renderDetail();

    await screen.findByTestId('habit-ribbon-interactive');

    const old = screen.getByTestId('habit-cell-2026-07-23');
    expect(old.tagName).toBe('SPAN');
    expect(screen.getByTestId('habit-cell-2026-08-04').tagName).toBe('BUTTON');
  });

  // A week cell means "2 of 3" — there is no single day a tap could toggle.
  it('renders a quota habit read-only', async () => {
    renderDetail(
      makeHabit({
        id: 'h1',
        scheduleKind: 'weekly_quota',
        timesPerWeek: 3,
        streakUnit: 'week',
        cells: [makeHabitCell({ date: '2026-08-03', progress: { current: 2, target: 3 } })],
      })
    );

    await screen.findByTestId('habit-ribbon-interactive');
    expect(screen.queryByRole('button', { name: /not done/i })).not.toBeInTheDocument();
    expect(screen.getByText(/read-only/i)).toBeInTheDocument();
  });

  it('archives after confirming and returns to the board', async () => {
    const user = userEvent.setup();
    let archived = false;
    server.use(
      http.delete(`${API}/habits/h1`, () => {
        archived = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderDetail();

    await user.click(await screen.findByTestId('habit-detail-archive'));
    await user.click(await screen.findByRole('button', { name: /^archive$/i }));

    await waitFor(() => expect(archived).toBe(true));
    // Asserted through the URL rather than a navigate spy: the observable
    // effect is what the user gets, and it survives a router refactor.
    await waitFor(() => expect(window.location.pathname).toBe('/habits'));
  });

  // "Archive" must not read as a polite word for delete, so the confirm says
  // plainly that the history survives.
  it('promises the history is kept when confirming an archive', async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByTestId('habit-detail-archive'));

    expect(await screen.findByText(/history is kept/i)).toBeInTheDocument();
  });

  it('shows a skeleton while loading', () => {
    renderDetail();

    expect(screen.getByTestId('habit-detail-loading')).toBeInTheDocument();
  });

  it('offers a retry when the habit fails to load', async () => {
    server.use(
      http.get(`${API}/habits/h1`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'x' } }, { status: 500 })
      )
    );

    renderComponent(
      <Routes>
        <Route path="/habits/:habitId" element={<HabitDetailView />} />
      </Routes>,
      { initialRoute: '/habits/h1' }
    );

    expect(await screen.findByTestId('habits-error')).toBeInTheDocument();
  });
});
