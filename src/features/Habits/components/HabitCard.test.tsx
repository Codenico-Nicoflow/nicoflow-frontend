import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeHabit } from '@/mocks/handlers';

import { HabitCard } from './HabitCard';

const API = 'http://localhost:8080/v1';

describe('HabitCard', () => {
  it('renders the habit name, schedule summary and streak', () => {
    renderComponent(
      <HabitCard habit={makeHabit({ name: 'Read', currentStreak: 5, unit: 'minutes', targetValue: 20 })} />
    );

    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText(/20 minutes/)).toBeInTheDocument();
    expect(screen.getByTestId('habit-streak-habit-1')).toHaveTextContent('5 days');
  });

  it('prints weeks for a quota habit, following the server’s streak unit', () => {
    renderComponent(
      <HabitCard
        habit={makeHabit({
          scheduleKind: 'weekly_quota',
          timesPerWeek: 3,
          streakUnit: 'week',
          currentStreak: 2,
          periodProgress: { current: 1, target: 3 },
        })}
      />
    );

    expect(screen.getByTestId('habit-streak-habit-1')).toHaveTextContent('2 weeks');
  });

  // The ring fills immediately because that is local truth — the user just
  // tapped it — while the streak waits for the server's recomputed number.
  it('fills the ring optimistically before the response lands', async () => {
    const user = userEvent.setup();
    let release: (() => void) | undefined;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });

    server.use(
      http.post(`${API}/habits/habit-1/check-in`, async () => {
        await gate;
        return HttpResponse.json({
          data: makeHabit({ completedToday: true, loggedToday: true, currentStreak: 1 }),
          error: null,
        });
      })
    );

    renderComponent(<HabitCard habit={makeHabit({ currentStreak: 0 })} />);

    // Deliberately NOT awaited: the assertion belongs inside the in-flight
    // window, which is the whole thing this test exists to prove.
    void user.click(screen.getByTestId('habit-ring-habit-1'));

    // Ring is already pressed…
    await waitFor(() => expect(screen.getByTestId('habit-ring-habit-1')).toHaveAttribute('aria-pressed', 'true'));
    // …while the streak still reads the server's last known value.
    expect(screen.getByTestId('habit-streak-habit-1')).toHaveTextContent('0 days');

    release?.();
  });

  // The streak is the emotionally loaded number: it must never tick up and then
  // visibly tick back down.
  it('rolls the ring back on failure and never moves the streak', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API}/habits/habit-1/check-in`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'nope' } }, { status: 500 })
      )
    );

    renderComponent(<HabitCard habit={makeHabit({ currentStreak: 5 })} />);

    await user.click(screen.getByTestId('habit-ring-habit-1'));

    await waitFor(() => expect(screen.getByTestId('habit-ring-habit-1')).toHaveAttribute('aria-pressed', 'false'));
    expect(screen.getByTestId('habit-streak-habit-1')).toHaveTextContent('5 days');
  });

  // Undo is a second tap with no confirmation — a mis-tap on a grid of cards is
  // routine, and a dialog would make the ritual heavier than the habit.
  it('undoes a completed habit on a second tap without confirming', async () => {
    const user = userEvent.setup();
    let undoCalled = false;
    server.use(
      http.delete(`${API}/habits/habit-1/check-in`, () => {
        undoCalled = true;
        return HttpResponse.json({ data: makeHabit({ completedToday: false }), error: null });
      })
    );

    renderComponent(<HabitCard habit={makeHabit({ completedToday: true, loggedToday: true, currentStreak: 3 })} />);

    await user.click(screen.getByTestId('habit-ring-habit-1'));

    await waitFor(() => expect(undoCalled).toBe(true));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  // Dimmed, never hidden: a habit that vanishes on its off day reads as data
  // loss rather than as "not scheduled today".
  it('dims an off-schedule habit and disables its ring', () => {
    renderComponent(
      <HabitCard habit={makeHabit({ dueToday: false, scheduleKind: 'weekdays', byWeekday: [1, 3, 5] })} />
    );

    expect(screen.getByTestId('habit-card-habit-1')).toHaveClass('opacity-60');
    expect(screen.getByTestId('habit-ring-habit-1')).toBeDisabled();
  });

  // Regression: the ring used to be gated on `dueToday`, which the server clears
  // the moment a habit is satisfied. Checking a habit in disabled its own undo.
  it('keeps the ring enabled on a completed habit so it can be undone', () => {
    renderComponent(<HabitCard habit={makeHabit({ completedToday: true, loggedToday: true, dueToday: false })} />);

    expect(screen.getByTestId('habit-ring-habit-1')).toBeEnabled();
  });

  // The sharpest form of the same bug: a quota habit leaves the due feed as soon
  // as it reaches its target, so the card locked itself for the rest of the week.
  it('keeps the ring enabled on a quota habit that has met its target', () => {
    renderComponent(
      <HabitCard
        habit={makeHabit({
          scheduleKind: 'weekly_quota',
          timesPerWeek: 3,
          streakUnit: 'week',
          periodProgress: { current: 3, target: 3 },
          completedToday: true,
          loggedToday: true,
          dueToday: false,
        })}
      />
    );

    expect(screen.getByTestId('habit-ring-habit-1')).toBeEnabled();
  });

  it('undoes a completed off-schedule habit end to end', async () => {
    const user = userEvent.setup();
    let undoCalled = false;
    server.use(
      http.delete(`${API}/habits/habit-1/check-in`, () => {
        undoCalled = true;
        return HttpResponse.json({ data: makeHabit({ completedToday: false }), error: null });
      })
    );

    renderComponent(<HabitCard habit={makeHabit({ completedToday: true, loggedToday: true, dueToday: false })} />);

    await user.click(screen.getByTestId('habit-ring-habit-1'));

    await waitFor(() => expect(undoCalled).toBe(true));
  });

  // Regression: the toggle used to ask `completedToday`, which for a quota
  // habit means "is the WEEK met" — so at 1 of 3 a second press checked in
  // again instead of undoing, and the count just climbed.
  it('undoes a quota habit that is logged today but short of its weekly target', async () => {
    const user = userEvent.setup();
    let undoCalled = false;
    server.use(
      http.delete(`${API}/habits/habit-1/check-in`, () => {
        undoCalled = true;
        return HttpResponse.json({ data: makeHabit(), error: null });
      }),
      http.post(`${API}/habits/habit-1/check-in`, () => {
        throw new Error('checked in again instead of undoing');
      })
    );

    renderComponent(
      <HabitCard
        habit={makeHabit({
          scheduleKind: 'weekly_quota',
          timesPerWeek: 3,
          streakUnit: 'week',
          periodProgress: { current: 1, target: 3 },
          loggedToday: true,
          completedToday: false, // the week is NOT met
        })}
      />
    );

    await user.click(screen.getByTestId('habit-ring-habit-1'));

    await waitFor(() => expect(undoCalled).toBe(true));
  });

  // A quota habit at 1 of 3 is logged but NOT finished, so the ring shows the
  // running count rather than a checkmark. Asserting "pressed" here was the
  // conflation that made the count flash 1 -> tick -> 0 on every tap.
  it('shows a quota habit logged today as a running count, not a checkmark', () => {
    renderComponent(
      <HabitCard
        habit={makeHabit({
          scheduleKind: 'weekly_quota',
          timesPerWeek: 3,
          periodProgress: { current: 1, target: 3 },
          loggedToday: true,
          completedToday: false,
        })}
      />
    );

    expect(screen.getByTestId('habit-ring-habit-1')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('habit-ring-count')).toHaveTextContent('1');
    expect(screen.queryByTestId('habit-ring-check')).not.toBeInTheDocument();
  });

  it('shows a checkmark once the quota week is met', () => {
    renderComponent(
      <HabitCard
        habit={makeHabit({
          scheduleKind: 'weekly_quota',
          timesPerWeek: 3,
          periodProgress: { current: 3, target: 3 },
          loggedToday: true,
          completedToday: true,
        })}
      />
    );

    expect(screen.getByTestId('habit-ring-habit-1')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('habit-ring-check')).toBeInTheDocument();
  });

  // Dimming answers "is there work here today", which a finished habit no longer
  // has — but it is finished, not unavailable, so it stays fully lit.
  it('does not dim a completed habit', () => {
    renderComponent(<HabitCard habit={makeHabit({ completedToday: true, loggedToday: true, dueToday: false })} />);

    expect(screen.getByTestId('habit-card-habit-1')).not.toHaveClass('opacity-60');
  });

  it('disables the ring on an archived habit', () => {
    renderComponent(<HabitCard habit={makeHabit({ archivedAt: '2026-08-01T00:00:00Z' })} />);

    expect(screen.getByTestId('habit-ring-habit-1')).toBeDisabled();
  });

  // The label has to name the habit: an icon-only control tells a screen reader
  // nothing about which of several cards it belongs to.
  it('labels the ring with the habit name and its state', () => {
    renderComponent(<HabitCard habit={makeHabit({ name: 'Read' })} />);

    expect(screen.getByTestId('habit-ring-habit-1')).toHaveAccessibleName(/Read/);
  });

  it('names the quota progress in the ring label', () => {
    renderComponent(
      <HabitCard
        habit={makeHabit({
          name: 'Read',
          scheduleKind: 'weekly_quota',
          timesPerWeek: 3,
          periodProgress: { current: 2, target: 3 },
        })}
      />
    );

    expect(screen.getByTestId('habit-ring-habit-1')).toHaveAccessibleName(/2 of 3/);
  });

  it('falls back to a generic icon for a subject this build does not know', () => {
    renderComponent(<HabitCard habit={makeHabit({ subject: 'underwater_basket_weaving' })} />);

    // The card still renders rather than blanking on the unknown slug.
    expect(screen.getByTestId('habit-card-habit-1')).toBeInTheDocument();
  });
});
