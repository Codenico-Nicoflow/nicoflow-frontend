import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import CalendarView from './index';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

// Fixed clock so the now-line and the default anchor never depend on the day
// the suite happens to run.
const NOW = new Date(2026, 7, 5, 10, 30); // Wed 2026-08-05

const rangeReturns = (tasks: ReturnType<typeof makeTask>[], onQuery?: (url: URL) => void) =>
  server.use(
    http.get(`${API}/tasks`, ({ request }) => {
      onQuery?.(new URL(request.url));
      return HttpResponse.json(env({ items: tasks }));
    })
  );

describe('CalendarView', () => {
  it('renders the current week with the now-line on today', async () => {
    rangeReturns([]);
    renderComponent(<CalendarView now={NOW} />);

    await waitFor(() => expect(screen.getByTestId('calendar-grid')).toBeInTheDocument());
    // Monday-first week around Wed 2026-08-05.
    expect(screen.getByTestId('calendar-day-2026-08-03')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-day-2026-08-09')).toBeInTheDocument();

    const today = screen.getByTestId('calendar-day-2026-08-05');
    expect(within(today).getByTestId('calendar-now-line')).toBeInTheDocument();
  });

  it('requests the visible week as an inclusive range', async () => {
    let url: URL | undefined;
    rangeReturns([], captured => {
      url = captured;
    });
    renderComponent(<CalendarView now={NOW} />);

    await waitFor(() => expect(url).toBeDefined());
    expect(url!.searchParams.get('scheduledFrom')).toBe('2026-08-03');
    expect(url!.searchParams.get('scheduledTo')).toBe('2026-08-09');
  });

  it('draws an estimated task as a block spanning its duration', async () => {
    rangeReturns([
      makeTask({
        id: 't1',
        title: 'Standup',
        scheduledFor: '2026-08-05',
        scheduledTime: '09:00',
        estimatedMinutes: 60,
      }),
    ]);
    renderComponent(<CalendarView now={NOW} />);

    const block = await screen.findByTestId('calendar-block-t1');
    expect(block).toHaveStyle({ top: '432px', height: '48px' });
    expect(block).not.toHaveAttribute('data-unestimated');
  });

  it('draws an unestimated task at the rendered default without ever writing an estimate', async () => {
    let patched = false;
    rangeReturns([
      makeTask({
        id: 't2',
        title: 'Deep work',
        scheduledFor: '2026-08-05',
        scheduledTime: '11:00',
        estimatedMinutes: null,
      }),
    ]);
    // Any write attempt while merely rendering is a bug — the 30-minute default
    // is presentation, not data.
    server.use(
      http.patch(`${API}/tasks/:id`, () => {
        patched = true;
        return HttpResponse.json(env(makeTask()));
      })
    );

    renderComponent(<CalendarView now={NOW} />);

    const block = await screen.findByTestId('calendar-block-t2');
    expect(block).toHaveAttribute('data-unestimated', 'true');
    expect(block).toHaveStyle({ height: '24px' });
    expect(patched).toBe(false);
  });

  it('puts untimed tasks in the all-day rail rather than the hour grid', async () => {
    rangeReturns([makeTask({ id: 't3', title: 'Read the RFC', scheduledFor: '2026-08-05', scheduledTime: null })]);
    renderComponent(<CalendarView now={NOW} />);

    await waitFor(() => expect(screen.getByTestId('calendar-allday-task-t3')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-block-t3')).not.toBeInTheDocument();
  });

  it('splits width between two tasks at the same time', async () => {
    rangeReturns([
      makeTask({ id: 'a', title: 'A', scheduledFor: '2026-08-05', scheduledTime: '09:00', estimatedMinutes: 60 }),
      makeTask({ id: 'b', title: 'B', scheduledFor: '2026-08-05', scheduledTime: '09:00', estimatedMinutes: 60 }),
    ]);
    renderComponent(<CalendarView now={NOW} />);

    const first = await screen.findByTestId('calendar-block-a');
    const second = await screen.findByTestId('calendar-block-b');
    expect(first).toHaveStyle({ width: '50%' });
    expect(second).toHaveStyle({ width: '50%' });
  });

  it('restores view and date from the URL', async () => {
    rangeReturns([]);
    renderComponent(<CalendarView now={NOW} />, { initialRoute: '/calendar?view=day&date=2026-08-20' });

    await waitFor(() => expect(screen.getByTestId('calendar-day-2026-08-20')).toBeInTheDocument());
    // Day view renders exactly one column.
    expect(screen.queryByTestId('calendar-day-2026-08-21')).not.toBeInTheDocument();
  });

  it('writes view changes back to the URL so the grid is shareable', async () => {
    const user = userEvent.setup();
    rangeReturns([]);
    renderComponent(<CalendarView now={NOW} />);

    await waitFor(() => expect(screen.getByTestId('calendar-view-day')).toBeInTheDocument());
    await user.click(screen.getByTestId('calendar-view-day'));

    await waitFor(() => expect(window.location.search).toContain('view=day'));
    expect(window.location.search).toContain('date=2026-08-05');
  });

  it('opens the shared TaskDialog when a block is clicked', async () => {
    const user = userEvent.setup();
    rangeReturns([
      makeTask({
        id: 't4',
        title: 'Standup',
        scheduledFor: '2026-08-05',
        scheduledTime: '09:00',
        estimatedMinutes: 30,
      }),
    ]);
    renderComponent(<CalendarView now={NOW} />);

    await user.click(await screen.findByTestId('calendar-block-t4'));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(within(screen.getByRole('dialog')).getByDisplayValue('Standup')).toBeInTheDocument();
  });
});
