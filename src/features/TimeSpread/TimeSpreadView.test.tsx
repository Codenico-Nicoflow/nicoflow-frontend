import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { renderComponent } from '../../../__tests__/renderComponent';
import { server } from '../../../__tests__/server';
import { makeTask } from '../../mocks/handlers';

import TimeSpreadView from './index';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

const pastIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().slice(0, 10);
};

describe('TimeSpreadView', () => {
  it('renders the today bucket', async () => {
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json(
          env({ today: [makeTask({ id: 't1', title: 'Ship the release' })], tomorrow: [], thisWeek: [] })
        )
      )
    );

    renderComponent(<TimeSpreadView activeTab="today" />);

    await waitFor(() => expect(screen.getByText('Ship the release')).toBeInTheDocument());
  });

  it('shows an encouraging empty state when the bucket is empty', async () => {
    server.use(http.get(`${API}/time-spread`, () => HttpResponse.json(env({ today: [], tomorrow: [], thisWeek: [] }))));

    renderComponent(<TimeSpreadView activeTab="today" />);

    await waitFor(() => expect(screen.getByTestId('timespread-empty')).toBeInTheDocument());
  });

  it('shows a carried-over task with a neutral chip — never red', async () => {
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json(
          env({
            today: [makeTask({ id: 'c1', title: 'Carried task', scheduledFor: pastIso(), rollsOver: true })],
            tomorrow: [],
            thisWeek: [],
          })
        )
      )
    );

    renderComponent(<TimeSpreadView activeTab="today" />);

    const chip = await screen.findByTestId('task-date-carriedOver');
    // The calm model: no red tone anywhere on a carried-over chip.
    expect(chip.className).not.toMatch(/red/);
  });

  it('groups the week bucket by day', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    const soonIso = soon.toISOString().slice(0, 10);
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json(
          env({
            today: [],
            tomorrow: [],
            thisWeek: [makeTask({ id: 'w1', title: 'Midweek task', scheduledFor: soonIso })],
          })
        )
      )
    );

    renderComponent(<TimeSpreadView activeTab="week" />);

    await waitFor(() => expect(screen.getByTestId(`timespread-day-${soonIso}`)).toBeInTheDocument());
    expect(screen.getByText('Midweek task')).toBeInTheDocument();
  });

  it('schedule quick-action PATCHes /schedule to move a task off today', async () => {
    let scheduleBody: unknown;
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json(env({ today: [makeTask({ id: 't1', title: 'Remove me' })], tomorrow: [], thisWeek: [] }))
      ),
      http.patch(`${API}/tasks/t1/schedule`, async ({ request }) => {
        scheduleBody = await request.json();
        return HttpResponse.json(env(makeTask({ id: 't1', scheduledFor: null })));
      })
    );

    const user = userEvent.setup();
    renderComponent(<TimeSpreadView activeTab="today" />);

    await waitFor(() => expect(screen.getByText('Remove me')).toBeInTheDocument());

    // Open the row's actions menu and pick "Remove from schedule".
    await user.click(screen.getByTestId('item-actions-menu-trigger'));
    await user.click(await screen.findByText(/remove from schedule/i));

    await waitFor(() => expect(scheduleBody).toEqual({ scheduledFor: null }));
  });

  it('completing a task from a day view toggles its status', async () => {
    let statusBody: unknown;
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json(
          env({ today: [makeTask({ id: 't1', title: 'Finish me', status: 'active' })], tomorrow: [], thisWeek: [] })
        )
      ),
      http.patch(`${API}/tasks/t1/status`, async ({ request }) => {
        statusBody = await request.json();
        return HttpResponse.json(env(makeTask({ id: 't1', status: 'done' })));
      })
    );

    const user = userEvent.setup();
    renderComponent(<TimeSpreadView activeTab="today" />);

    await waitFor(() => expect(screen.getByText('Finish me')).toBeInTheDocument());
    await user.click(screen.getByTestId('timespread-checkbox-t1'));

    await waitFor(() => expect(statusBody).toEqual({ status: 'done' }));
  });

  it('surfaces the day column with a within-scoped list', async () => {
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json(env({ today: [makeTask({ id: 't1', title: 'Scoped' })], tomorrow: [], thisWeek: [] }))
      )
    );

    renderComponent(<TimeSpreadView activeTab="today" />);

    const list = await screen.findByTestId('timespread-list');
    expect(within(list).getByText('Scoped')).toBeInTheDocument();
  });
});
