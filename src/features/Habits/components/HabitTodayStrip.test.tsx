import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeHabit } from '@/mocks/handlers';

import { HabitTodayStrip } from './HabitTodayStrip';

const API = 'http://localhost:8080/v1';

const withHabits = (due: ReturnType<typeof makeHabit>[], all = due) => {
  server.use(
    http.get(`${API}/habits/today`, () => HttpResponse.json({ data: due, error: null })),
    http.get(`${API}/habits`, () => HttpResponse.json({ data: all, error: null }))
  );
};

describe('HabitTodayStrip', () => {
  it('renders the habits still owed today', async () => {
    withHabits([makeHabit({ id: 'h1', name: 'Read' }), makeHabit({ id: 'h2', name: 'Walk' })]);

    renderComponent(<HabitTodayStrip />);

    expect(await screen.findByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Walk')).toBeInTheDocument();
  });

  // A strip that disappears on completion reads as a bug, not an achievement.
  it('collapses to one line when everything is done', async () => {
    withHabits([], [makeHabit({ completedToday: true, loggedToday: true })]);

    renderComponent(<HabitTodayStrip />);

    expect(await screen.findByTestId('habit-strip-done')).toBeInTheDocument();
    expect(screen.queryByTestId('habit-strip')).not.toBeInTheDocument();
  });

  // The user has not opted into this feature; Today is not the place to
  // advertise it.
  it('renders nothing at all for a user with no habits', async () => {
    withHabits([], []);

    renderComponent(<HabitTodayStrip />);

    await waitFor(() => expect(screen.queryByTestId('habit-strip-loading')).not.toBeInTheDocument());
    expect(screen.queryByTestId('habit-strip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('habit-strip-done')).not.toBeInTheDocument();
  });

  // A secondary surface on someone else's page fails quietly: an error banner
  // above the task list would be louder than the feature.
  it('stays silent when the feed fails', async () => {
    server.use(
      http.get(`${API}/habits/today`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'x' } }, { status: 500 })
      )
    );

    renderComponent(<HabitTodayStrip />);

    await waitFor(() => expect(screen.queryByTestId('habit-strip-loading')).not.toBeInTheDocument());
    expect(screen.queryByTestId('habit-strip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('habit-strip-done')).not.toBeInTheDocument();
  });

  it('checks in inline without leaving Today', async () => {
    const user = userEvent.setup();
    withHabits([makeHabit({ id: 'h1', name: 'Read' })]);

    let checkedIn = false;
    server.use(
      http.post(`${API}/habits/h1/check-in`, () => {
        checkedIn = true;
        return HttpResponse.json({
          data: makeHabit({ id: 'h1', completedToday: true, loggedToday: true }),
          error: null,
        });
      })
    );

    renderComponent(<HabitTodayStrip />);

    await user.click(await screen.findByTestId('habit-strip-ring-h1'));

    await waitFor(() => expect(checkedIn).toBe(true));
  });

  // The mis-tap and its correction happen seconds apart. Making the user
  // navigate to the habits page to undo a slip they just made is the friction
  // that gets a feature abandoned, so a completed habit lingers for the session.
  it('keeps a habit in the strip after it leaves the due feed', async () => {
    const user = userEvent.setup();
    const gym = makeHabit({ id: 'gym', name: 'Gym', scheduleKind: 'weekly_quota', timesPerWeek: 3 });
    const completed = { ...gym, completedToday: true, loggedToday: true, dueToday: false };

    let checkedIn = false;
    server.use(
      // Once checked in, the server drops it from the due feed entirely.
      http.get(`${API}/habits/today`, () => HttpResponse.json({ data: checkedIn ? [] : [gym], error: null })),
      http.get(`${API}/habits`, () => HttpResponse.json({ data: [checkedIn ? completed : gym], error: null })),
      http.post(`${API}/habits/gym/check-in`, () => {
        checkedIn = true;
        return HttpResponse.json({ data: completed, error: null });
      })
    );

    renderComponent(<HabitTodayStrip />);

    await user.click(await screen.findByTestId('habit-strip-ring-gym'));

    // Still on screen, now reading as done, so the undo is where the tap was.
    await waitFor(() => expect(screen.getByTestId('habit-strip-ring-gym')).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByTestId('habit-strip-item-gym')).toBeInTheDocument();
  });

  it('undoes a lingering habit without leaving Today', async () => {
    const user = userEvent.setup();
    const gym = makeHabit({ id: 'gym', name: 'Gym', scheduleKind: 'weekly_quota', timesPerWeek: 3 });
    const completed = { ...gym, completedToday: true, loggedToday: true, dueToday: false };

    let checkedIn = false;
    let undone = false;
    server.use(
      http.get(`${API}/habits/today`, () => HttpResponse.json({ data: checkedIn ? [] : [gym], error: null })),
      http.get(`${API}/habits`, () => HttpResponse.json({ data: [checkedIn ? completed : gym], error: null })),
      http.post(`${API}/habits/gym/check-in`, () => {
        checkedIn = true;
        return HttpResponse.json({ data: completed, error: null });
      }),
      http.delete(`${API}/habits/gym/check-in`, () => {
        undone = true;
        checkedIn = false;
        return HttpResponse.json({ data: gym, error: null });
      })
    );

    renderComponent(<HabitTodayStrip />);

    // Check in — the habit leaves the due feed but lingers in the strip.
    await user.click(await screen.findByTestId('habit-strip-ring-gym'));
    await waitFor(() => expect(screen.getByTestId('habit-strip-ring-gym')).toHaveAttribute('aria-pressed', 'true'));

    // Undo it from the same ring, on the same page.
    await user.click(screen.getByTestId('habit-strip-ring-gym'));
    await waitFor(() => expect(undone).toBe(true));
  });

  // The strip is a five-second ritual; history belongs on the habits page where
  // there is room to read it.
  it('omits the ribbon', async () => {
    withHabits([makeHabit({ id: 'h1', currentStreak: 9 })]);

    renderComponent(<HabitTodayStrip />);

    await screen.findByTestId('habit-strip-item-h1');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows a skeleton while loading rather than an empty gap', () => {
    renderComponent(<HabitTodayStrip />);

    expect(screen.getByTestId('habit-strip-loading')).toBeInTheDocument();
  });
});
