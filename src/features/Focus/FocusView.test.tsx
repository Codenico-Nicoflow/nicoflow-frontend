import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('shows a pick-time prompt and no list until a time window is chosen', async () => {
    const seen: URLSearchParams[] = [];
    server.use(
      http.get(`${API}/focus`, ({ request }) => {
        seen.push(new URL(request.url).searchParams);
        return HttpResponse.json(items(ranked));
      })
    );

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    // Default: prompt only, no query fired, no list.
    expect(screen.getByTestId('focus-time-prompt')).toBeInTheDocument();
    expect(screen.queryByTestId('focus-list')).not.toBeInTheDocument();
    expect(seen).toHaveLength(0);

    await user.click(screen.getByTestId('focus-time-m30'));

    await waitFor(() => expect(screen.getByTestId('focus-list')).toBeInTheDocument());
    expect(screen.getByText('Quick low-energy win')).toBeInTheDocument();
    await waitFor(() => expect(seen.some(p => p.get('available') === '30')).toBe(true));
  });

  it('re-ranks with the energy preference when an energy chip is added', async () => {
    const seen: URLSearchParams[] = [];
    server.use(
      http.get(`${API}/focus`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        seen.push(params);
        return HttpResponse.json(items(params.get('energy') === 'low' ? [ranked[0]] : ranked));
      })
    );

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await user.click(screen.getByTestId('focus-time-m30'));
    await waitFor(() => expect(screen.getByText('Deep work block')).toBeInTheDocument());

    // Energy is a dropdown now: open the trigger, then pick "low".
    await user.click(screen.getByTestId('focus-energy'));
    await user.click(await screen.findByTestId('focus-energy-low'));
    await waitFor(() => expect(screen.queryByText('Deep work block')).not.toBeInTheDocument());
    await waitFor(() => expect(seen.some(p => p.get('energy') === 'low')).toBe(true));
  });

  it('Start opens the NOW card in-place without leaving Focus', async () => {
    server.use(http.get(`${API}/focus`, () => HttpResponse.json(items(ranked))));

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await user.click(screen.getByTestId('focus-time-m30'));
    await waitFor(() => expect(screen.getByTestId('focus-start-r1')).toBeInTheDocument());

    await user.click(screen.getByTestId('focus-start-r1'));

    const now = await screen.findByTestId('focus-now-card');
    expect(within(now).getByText('Quick low-energy win')).toBeInTheDocument();
    // The started task is no longer a plain list row; the other is now "up next".
    expect(screen.getByText('Deep work block')).toBeInTheDocument();
    expect(screen.queryByTestId('focus-start-r1')).not.toBeInTheDocument();
  });

  it('Done completes the current task and advances to the next', async () => {
    let patched: { status?: string } | undefined;
    server.use(
      http.get(`${API}/focus`, () => HttpResponse.json(items(ranked))),
      http.patch(`${API}/tasks/r1/status`, async ({ request }) => {
        patched = (await request.json()) as { status?: string };
        return HttpResponse.json({ data: makeTask({ id: 'r1', status: 'done' }), error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await user.click(screen.getByTestId('focus-time-m30'));
    await user.click(await screen.findByTestId('focus-start-r1'));
    await user.click(await screen.findByTestId('focus-done'));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(patched).toEqual({ status: 'done' });
    // The next ranked task is promoted into the NOW card.
    const now = await screen.findByTestId('focus-now-card');
    expect(within(now).getByText('Deep work block')).toBeInTheDocument();
  });

  it('Not now cancels the session and returns to the ranked shortlist', async () => {
    server.use(http.get(`${API}/focus`, () => HttpResponse.json(items(ranked))));

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await user.click(screen.getByTestId('focus-time-m30'));
    await user.click(await screen.findByTestId('focus-start-r1'));
    expect(await screen.findByTestId('focus-now-card')).toBeInTheDocument();

    await user.click(screen.getByTestId('focus-cancel'));

    // Not now exits the NOW card — no advance, back to the full list.
    await waitFor(() => expect(screen.queryByTestId('focus-now-card')).not.toBeInTheDocument());
    expect(await screen.findByTestId('focus-list')).toBeInTheDocument();
    expect(screen.getByText('Quick low-energy win')).toBeInTheDocument();
    expect(screen.getByText('Deep work block')).toBeInTheDocument();
  });

  it('Start on another up-next task switches the NOW card mid-session', async () => {
    server.use(http.get(`${API}/focus`, () => HttpResponse.json(items(ranked))));

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await user.click(screen.getByTestId('focus-time-m30'));
    await user.click(await screen.findByTestId('focus-start-r1'));
    await user.click(await screen.findByTestId('focus-start-r2'));

    const now = await screen.findByTestId('focus-now-card');
    expect(within(now).getByText('Deep work block')).toBeInTheDocument();
  });

  it('shows an encouraging, non-dead-end empty state when nothing fits the window', async () => {
    server.use(http.get(`${API}/focus`, () => HttpResponse.json(items([]))));

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await user.click(screen.getByTestId('focus-time-m15'));

    await waitFor(() => expect(screen.getByTestId('focus-empty')).toBeInTheDocument());
    expect(screen.getByText(/nothing fits that window/i)).toBeInTheDocument();

    // The way out: change the time back to the prompt, not a dead end.
    await user.click(screen.getByTestId('focus-empty-clear'));
    expect(screen.getByTestId('focus-time-prompt')).toBeInTheDocument();
  });

  it('keeps a hidden slot for the Phase-4 Pro rationale', async () => {
    server.use(http.get(`${API}/focus`, () => HttpResponse.json(items([ranked[0]]))));

    const user = userEvent.setup();
    renderComponent(<FocusView />);

    await user.click(screen.getByTestId('focus-time-m30'));
    await waitFor(() => expect(screen.getByText('Quick low-energy win')).toBeInTheDocument());

    const slot = screen.getByTestId('focus-rationale-r1');
    expect(slot).toBeInTheDocument();
    expect(slot).not.toBeVisible();
  });
});
