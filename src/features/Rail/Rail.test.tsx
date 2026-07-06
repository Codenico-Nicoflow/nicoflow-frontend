import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import { Rail } from './index';

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

describe('Rail', () => {
  it('renders the primary destinations + settings', () => {
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });
    for (const id of ['rail-today', 'rail-inbox', 'rail-areas', 'rail-settings']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  it('marks Areas active on a project route (prefix match)', () => {
    renderComponent(<Rail />, { initialRoute: '/projects/abc-123' });
    expect(screen.getByTestId('rail-areas')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('rail-today')).not.toHaveAttribute('aria-current');
  });

  it('shows the count of today tasks as a badge on the Today item', async () => {
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json(env({ today: [makeTask({ id: 'a' }), makeTask({ id: 'b' })], tomorrow: [], thisWeek: [] }))
      )
    );

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.getByTestId('rail-today-badge')).toHaveTextContent('2'));
  });

  it('hides the Today badge when nothing is scheduled', async () => {
    server.use(http.get(`${API}/time-spread`, () => HttpResponse.json(env({ today: [], tomorrow: [], thisWeek: [] }))));

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.getByTestId('rail-today')).toBeInTheDocument());
    expect(screen.queryByTestId('rail-today-badge')).not.toBeInTheDocument();
  });
});
