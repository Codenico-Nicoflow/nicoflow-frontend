import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeHabit } from '@/mocks/handlers';

import { HabitCard } from './components/HabitCard';
import { HabitsView } from './index';

const API = 'http://localhost:8080/v1';

expect.extend(toHaveNoViolations);

describe('Habits accessibility', () => {
  it('has no axe violations on a populated board', async () => {
    server.use(
      http.get(`${API}/habits`, () =>
        HttpResponse.json({
          data: [
            makeHabit({ id: 'h1', name: 'Read', currentStreak: 4 }),
            makeHabit({ id: 'h2', name: 'Walk', dueToday: false }),
          ],
          error: null,
        })
      )
    );

    const { container } = renderComponent(<HabitsView />);
    await screen.findByText('Read');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations on the empty state', async () => {
    server.use(http.get(`${API}/habits`, () => HttpResponse.json({ data: [], error: null })));

    const { container } = renderComponent(<HabitsView />);
    await screen.findByTestId('habits-empty');

    expect(await axe(container)).toHaveNoViolations();
  });

  // The ring is a real button, so it has to work from the keyboard alone — the
  // check-in is the feature's primary action and cannot be pointer-only.
  it('checks in from the keyboard', async () => {
    const user = userEvent.setup();
    let checkedIn = false;
    server.use(
      http.post(`${API}/habits/habit-1/check-in`, () => {
        checkedIn = true;
        return HttpResponse.json({ data: makeHabit({ completedToday: true, loggedToday: true }), error: null });
      })
    );

    renderComponent(<HabitCard habit={makeHabit()} />);

    await user.tab();
    expect(screen.getByTestId('habit-ring-habit-1')).toHaveFocus();

    await user.keyboard('{Enter}');
    await waitFor(() => expect(checkedIn).toBe(true));
  });

  // Thirty tab stops per card would be hostile; the ribbon is one labelled image
  // and the card exposes exactly two stops — the ring and the open action.
  it('keeps the ribbon out of the tab order', async () => {
    const user = userEvent.setup();
    renderComponent(<HabitCard habit={makeHabit()} />);

    await user.tab();
    expect(screen.getByTestId('habit-ring-habit-1')).toHaveFocus();

    await user.tab();
    expect(screen.getByTestId('habit-open-habit-1')).toHaveFocus();
  });
});
