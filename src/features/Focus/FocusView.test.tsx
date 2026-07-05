import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderComponent } from '../../../__tests__/renderComponent';
import { server } from '../../../__tests__/server';
import { makeTask } from '../../mocks/handlers';

import FocusView from './index';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const items = <T,>(list: T[]) => ({ data: { items: list }, error: null });

const ranked = [
  makeTask({ id: 'r1', title: 'Quick low-energy win', status: 'active', energy: 'low', estimatedMinutes: 10 }),
  makeTask({ id: 'r2', title: 'Deep work block', status: 'active', energy: 'deep', estimatedMinutes: 90 }),
];

describe('FocusView', () => {
  it('renders the ranked focus list and re-fetches when chips change', async () => {
    const seen: URLSearchParams[] = [];
    server.use(
      http.get(`${API}/focus`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        seen.push(params);
        // 30m/low narrows the ranking to the quick win.
        if (params.get('available') === '30' && params.get('energy') === 'low') {
          return HttpResponse.json(items([ranked[0]]));
        }
        return HttpResponse.json(items(ranked));
      })
    );

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await waitFor(() => expect(screen.getByText('Quick low-energy win')).toBeInTheDocument());
    expect(screen.getByText('Deep work block')).toBeInTheDocument();

    await user.click(screen.getByTestId('focus-time-m30'));
    await user.click(screen.getByTestId('focus-energy-low'));

    await waitFor(() => expect(screen.queryByText('Deep work block')).not.toBeInTheDocument());
    expect(screen.getByText('Quick low-energy win')).toBeInTheDocument();
    expect(seen.at(-1)?.get('available')).toBe('30');
    expect(seen.at(-1)?.get('energy')).toBe('low');
  });

  it('Start makes the task active and scheduled for today', async () => {
    let patched: { status?: string; scheduledFor?: string } | undefined;
    server.use(
      http.get(`${API}/focus`, () => HttpResponse.json(items([ranked[0]]))),
      http.patch(`${API}/tasks/r1`, async ({ request }) => {
        patched = (await request.json()) as { status?: string; scheduledFor?: string };
        return HttpResponse.json({ data: makeTask({ id: 'r1', status: 'active' }), error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await waitFor(() => expect(screen.getByTestId('focus-start-r1')).toBeInTheDocument());
    await user.click(screen.getByTestId('focus-start-r1'));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(patched).toEqual({ status: 'active', scheduledFor: format(new Date(), 'yyyy-MM-dd') });
  });

  it('shows an encouraging, non-dead-end empty state when nothing fits the budget', async () => {
    server.use(http.get(`${API}/focus`, () => HttpResponse.json(items([]))));

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await user.click(screen.getByTestId('focus-time-m15'));
    await user.click(screen.getByTestId('focus-energy-low'));

    await waitFor(() => expect(screen.getByTestId('focus-empty')).toBeInTheDocument());
    expect(screen.getByText(/that's fine/i)).toBeInTheDocument();

    // The way out: clear the chips instead of a dead end.
    await user.click(screen.getByTestId('focus-empty-clear'));
    expect(screen.getByTestId('focus-time-m15')).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps a hidden slot for the Phase-4 Pro rationale', async () => {
    server.use(http.get(`${API}/focus`, () => HttpResponse.json(items([ranked[0]]))));

    renderComponent(<FocusView />);

    await waitFor(() => expect(screen.getByText('Quick low-energy win')).toBeInTheDocument());
    const slot = screen.getByTestId('focus-rationale-r1');
    expect(slot).toBeInTheDocument();
    expect(slot).not.toBeVisible();
  });
});
