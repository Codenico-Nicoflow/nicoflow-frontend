import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { IRecurrenceRule } from '@/lib/types';
import { RecurrenceFreq } from '@/lib/types';

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

    await waitFor(() => expect(body).toEqual({ paused: true }));
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
