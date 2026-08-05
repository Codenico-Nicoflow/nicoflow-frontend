import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeHabit, makeHabitCell } from '@/mocks/handlers';

import { HabitsView } from './index';

const API = 'http://localhost:8080/v1';

const active = makeHabit({ id: 'act', name: 'Read' });
const archived = makeHabit({ id: 'arc', name: 'Old habit', archivedAt: '2026-07-01T00:00:00Z' });

// The endpoint returns archived rows only when asked, so the two segments are
// genuinely different requests rather than one list filtered twice.
const withBoard = () => {
  server.use(
    http.get(`${API}/habits`, ({ request }) => {
      const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true';
      return HttpResponse.json({ data: includeArchived ? [active, archived] : [active], error: null });
    })
  );
};

describe('HabitsView segments', () => {
  it('shows active habits by default', async () => {
    withBoard();

    renderComponent(<HabitsView />);

    expect(await screen.findByText('Read')).toBeInTheDocument();
    expect(screen.queryByText('Old habit')).not.toBeInTheDocument();
  });

  // Interleaving retired habits would make the plan count read as a lie: the
  // Active board shows exactly what counts against the limit.
  it('shows only archived habits on the archived segment', async () => {
    const user = userEvent.setup();
    withBoard();

    renderComponent(<HabitsView />);
    await screen.findByText('Read');

    await user.click(screen.getByTestId('habits-segment-archived'));

    expect(await screen.findByText('Old habit')).toBeInTheDocument();
    expect(screen.queryByText('Read')).not.toBeInTheDocument();
  });

  it('offers Restore on an archived habit and not on an active one', async () => {
    const user = userEvent.setup();
    withBoard();

    renderComponent(<HabitsView />);
    await screen.findByText('Read');
    expect(screen.queryByTestId('habit-restore-act')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('habits-segment-archived'));

    expect(await screen.findByTestId('habit-restore-arc')).toBeInTheDocument();
  });

  it('restores through the update endpoint', async () => {
    const user = userEvent.setup();
    withBoard();

    let body: unknown;
    server.use(
      http.patch(`${API}/habits/arc`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: { ...archived, archivedAt: null }, error: null });
      })
    );

    renderComponent(<HabitsView />);
    await screen.findByText('Read');
    await user.click(screen.getByTestId('habits-segment-archived'));
    await user.click(await screen.findByTestId('habit-restore-arc'));

    await waitFor(() => expect(body).toEqual({ archived: false }));
  });

  it('tells the user when nothing is archived', async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API}/habits`, () => HttpResponse.json({ data: [active], error: null })));

    renderComponent(<HabitsView />);
    await screen.findByText('Read');

    await user.click(screen.getByTestId('habits-segment-archived'));

    expect(await screen.findByTestId('habits-archived-empty')).toBeInTheDocument();
  });

  // The list read carries its own window, so a card draws a ribbon without
  // anyone fetching per-habit history.
  it('draws a ribbon from the cells the list already returned', async () => {
    server.use(
      http.get(`${API}/habits`, () =>
        HttpResponse.json({
          data: [makeHabit({ id: 'act', cells: [makeHabitCell({ satisfied: true })] })],
          error: null,
        })
      )
    );

    renderComponent(<HabitsView />);

    expect(await screen.findByTestId('habit-ribbon-act')).toBeInTheDocument();
  });

  // A server that predates the cells field simply omits it; the card must then
  // render without a ribbon rather than break.
  it('renders a card without a ribbon when the list carries no cells', async () => {
    server.use(http.get(`${API}/habits`, () => HttpResponse.json({ data: [active], error: null })));

    renderComponent(<HabitsView />);

    await screen.findByText('Read');
    expect(screen.queryByTestId('habit-ribbon-act')).not.toBeInTheDocument();
  });
});
