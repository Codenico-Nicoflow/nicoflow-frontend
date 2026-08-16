import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { ActiveTab } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeHabit } from '@/mocks/handlers';

import TimeSpreadView from './index';

const API = 'http://localhost:8080/v1';

const withHabits = () => {
  const habits = [makeHabit({ id: 'h1', name: 'Read' })];
  server.use(
    http.get(`${API}/habits/today`, () => HttpResponse.json({ data: habits, error: null })),
    http.get(`${API}/habits`, () => HttpResponse.json({ data: habits, error: null }))
  );
};

describe('Today habit strip placement', () => {
  it('renders the strip above the task content', async () => {
    withHabits();

    renderComponent(<TimeSpreadView activeTab={ActiveTab.TODAY} />);

    const strip = await screen.findByTestId('habit-strip');
    // Either the list or the empty state follows, depending on the task fixture.
    const taskContent = screen.getAllByTestId(/timespread-(list|empty|loading)/)[0]!;

    // DOCUMENT_POSITION_FOLLOWING === 4: the strip precedes the task content.
    expect(strip.compareDocumentPosition(taskContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // The other tabs are about future work, where a habit has nothing to say yet.
  it.each([ActiveTab.TOMORROW, ActiveTab.WEEK])('omits the strip on the %s tab', async tab => {
    withHabits();

    renderComponent(<TimeSpreadView activeTab={tab} />);

    await screen.findByTestId(/timespread-(list|empty|week|loading)/);
    expect(screen.queryByTestId('habit-strip')).not.toBeInTheDocument();
  });

  // Habits come from their own endpoint. Welding them into the time-spread
  // response would undo the domain separation the whole epic is built on.
  it('does not read habits from the time-spread response', async () => {
    let timeSpreadCalled = false;
    server.use(
      http.get(`${API}/time-spread`, () => {
        timeSpreadCalled = true;
        return HttpResponse.json({ data: { today: [], tomorrow: [], thisWeek: [] }, error: null });
      })
    );
    withHabits();

    renderComponent(<TimeSpreadView activeTab={ActiveTab.TODAY} />);

    // The strip still populates, from /habits/today rather than from the
    // time-spread payload above.
    expect(await screen.findByText('Read')).toBeInTheDocument();
    await waitFor(() => expect(timeSpreadCalled).toBe(true));
  });
});
