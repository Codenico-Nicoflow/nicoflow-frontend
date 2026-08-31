import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { IRecurrenceRule } from '@nicoflow/shared/types';
import { RecurrenceFreq } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeUser } from '@/mocks/handlers';

import { RecurrenceCard } from './RecurrenceCard';

const API = 'http://localhost:8080/v1';

const makeRule = (overrides: Partial<IRecurrenceRule> = {}): IRecurrenceRule => ({
  id: 'r1',
  projectId: 'p1',
  title: 'Water the plants',
  notes: null,
  priority: 'medium',
  energy: 'medium',
  estimatedMinutes: null,
  freq: RecurrenceFreq.WEEKLY,
  interval: 1,
  byWeekday: [1],
  byMonthday: null,
  startDate: '2026-03-02',
  endDate: null,
  nextOccurrence: '2026-03-09',
  paused: false,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
  ...overrides,
});

const listReturns = (rules: IRecurrenceRule[]) =>
  server.use(http.get(`${API}/recurrence-rules`, () => HttpResponse.json({ data: { items: rules }, error: null })));

const statsReturns = (stats = { done: 4, missed: 1, cancelled: 0, streak: 2 }) =>
  server.use(http.get(`${API}/recurrence-rules/:id/stats`, () => HttpResponse.json({ data: stats, error: null })));

describe('RecurrenceCard', () => {
  it('shows a skeleton while the rules load, never a blank gap', () => {
    listReturns([]);
    renderComponent(<RecurrenceCard />);

    expect(screen.getByTestId('recurrence-loading')).toBeInTheDocument();
  });

  it('renders an empty state with a hint when there are no rules', async () => {
    listReturns([]);
    renderComponent(<RecurrenceCard />);

    expect(await screen.findByTestId('recurrence-empty')).toBeInTheDocument();
  });

  it('lists a rule with its schedule summary and next occurrence', async () => {
    listReturns([makeRule()]);
    statsReturns();
    renderComponent(<RecurrenceCard />);

    expect(await screen.findByTestId('recurrence-rule-r1')).toBeInTheDocument();
    expect(screen.getByText('Water the plants')).toBeInTheDocument();
    expect(screen.getByText(/2026-03-09/)).toBeInTheDocument();
  });

  it('renders the derived stats once loaded', async () => {
    listReturns([makeRule()]);
    statsReturns({ done: 4, missed: 1, cancelled: 0, streak: 2 });
    renderComponent(<RecurrenceCard />);

    await waitFor(() => expect(screen.getByText(/2 in a row/i)).toBeInTheDocument());
  });

  it('marks a paused rule so it reads as inactive', async () => {
    listReturns([makeRule({ paused: true })]);
    statsReturns();
    renderComponent(<RecurrenceCard />);

    expect(await screen.findByText(/paused/i)).toBeInTheDocument();
  });

  it('shows "no more occurrences" when the series is exhausted', async () => {
    listReturns([makeRule({ nextOccurrence: null })]);
    statsReturns();
    renderComponent(<RecurrenceCard />);

    expect(await screen.findByText(/no more occurrences/i)).toBeInTheDocument();
  });

  it('surfaces the free-plan cap once the limit is reached', async () => {
    listReturns([makeRule({ id: 'r1' }), makeRule({ id: 'r2' }), makeRule({ id: 'r3' })]);
    statsReturns();
    renderComponent(<RecurrenceCard />);

    expect(await screen.findByTestId('recurrence-limit-hint')).toBeInTheDocument();
  });

  it('never shows the free-plan cap to a Pro user, who has no limit', async () => {
    listReturns([makeRule({ id: 'r1' }), makeRule({ id: 'r2' }), makeRule({ id: 'r3' })]);
    statsReturns();
    renderComponent(<RecurrenceCard />, {
      store: createMockStore({ auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } }),
    });

    expect(await screen.findByTestId('recurrence-rule-r1')).toBeInTheDocument();
    expect(screen.queryByTestId('recurrence-limit-hint')).not.toBeInTheDocument();
  });

  it('shows the time of day alongside the next occurrence when the rule is timed', async () => {
    listReturns([makeRule({ scheduledTime: '09:00' })]);
    statsReturns();
    renderComponent(<RecurrenceCard />);

    expect(await screen.findByText(/2026-03-09 · 09:00/)).toBeInTheDocument();
  });

  it('sends a pause request from the row menu', async () => {
    listReturns([makeRule()]);
    statsReturns();
    let body: Record<string, unknown> = {};
    server.use(
      http.patch(`${API}/recurrence-rules/r1/pause`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: makeRule({ paused: true }), error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(<RecurrenceCard />);

    await user.click(await screen.findByTestId('recurrence-actions-r1'));
    await user.click(await screen.findByText(/^pause$/i));

    // Confirm the pause dialog
    await user.click(await screen.findByRole('button', { name: /^pause$/i }));

    await waitFor(() => expect(body).toEqual({ paused: true }));
  });

  it('shows a confirm dialog when pausing (not when resuming)', async () => {
    listReturns([makeRule()]);
    statsReturns();

    const user = userEvent.setup();
    renderComponent(<RecurrenceCard />);

    await user.click(await screen.findByTestId('recurrence-actions-r1'));
    await user.click(await screen.findByText(/^pause$/i));

    // Confirm dialog appears for pause (it cancels the live occurrence)
    expect(await screen.findByTestId('recurrence-pause-confirm-content')).toBeInTheDocument();
  });

  it('does NOT show a confirm dialog when resuming', async () => {
    listReturns([makeRule({ paused: true })]);
    statsReturns();
    server.use(
      http.patch(`${API}/recurrence-rules/r1/pause`, () =>
        HttpResponse.json({ data: makeRule({ paused: false }), error: null })
      )
    );

    const user = userEvent.setup();
    renderComponent(<RecurrenceCard />);

    await user.click(await screen.findByTestId('recurrence-actions-r1'));
    await user.click(await screen.findByText(/^resume$/i));

    // No confirm dialog — resuming is safe
    expect(screen.queryByTestId('recurrence-pause-confirm-content')).not.toBeInTheDocument();
  });

  it('paginates rules 5 per page and steps forward/back', async () => {
    const rules = Array.from({ length: 7 }, (_, i) => makeRule({ id: `r${i + 1}`, title: `Rule ${i + 1}` }));
    listReturns(rules);
    statsReturns();
    const user = userEvent.setup();
    renderComponent(<RecurrenceCard />, {
      store: createMockStore({ auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } }),
    });

    expect(await screen.findByTestId('recurrence-rule-r1')).toBeInTheDocument();
    expect(screen.getByTestId('recurrence-rule-r5')).toBeInTheDocument();
    expect(screen.queryByTestId('recurrence-rule-r6')).not.toBeInTheDocument();
    expect(screen.getByTestId('recurrence-pager-prev')).toBeDisabled();

    await user.click(screen.getByTestId('recurrence-pager-next'));

    expect(await screen.findByTestId('recurrence-rule-r6')).toBeInTheDocument();
    expect(screen.getByTestId('recurrence-rule-r7')).toBeInTheDocument();
    expect(screen.queryByTestId('recurrence-rule-r1')).not.toBeInTheDocument();
    expect(screen.getByTestId('recurrence-pager-next')).toBeDisabled();

    await user.click(screen.getByTestId('recurrence-pager-prev'));

    expect(await screen.findByTestId('recurrence-rule-r1')).toBeInTheDocument();
  });

  it('hides the pager entirely when everything fits on one page', async () => {
    listReturns([makeRule()]);
    statsReturns();
    renderComponent(<RecurrenceCard />);

    expect(await screen.findByTestId('recurrence-rule-r1')).toBeInTheDocument();
    expect(screen.queryByTestId('recurrence-pager')).not.toBeInTheDocument();
  });

  it('asks for confirmation before ending a series', async () => {
    listReturns([makeRule()]);
    statsReturns();

    const user = userEvent.setup();
    renderComponent(<RecurrenceCard />);

    await user.click(await screen.findByTestId('recurrence-actions-r1'));
    await user.click(await screen.findByText(/^delete$/i));

    expect(await screen.findByText(/delete repeating task\?/i)).toBeInTheDocument();
  });
});
