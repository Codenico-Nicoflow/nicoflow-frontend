import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
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
    expect(screen.getByTestId('calendar-block-wrapper-t1')).toHaveStyle({ top: '432px', height: '48px' });
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
    expect(screen.getByTestId('calendar-block-wrapper-t2')).toHaveStyle({ height: '24px' });
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

    await screen.findByTestId('calendar-block-a');
    expect(screen.getByTestId('calendar-block-wrapper-a')).toHaveStyle({ width: '50%' });
    expect(screen.getByTestId('calendar-block-wrapper-b')).toHaveStyle({ width: '50%' });
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

  it('moves a block by drag and persists the snapped time via the schedule endpoint', async () => {
    // Stateful mock: the post-mutation refetch must return the moved task, or
    // the grid would legitimately snap back and hide a real regression.
    let current = makeTask({
      id: 't5',
      title: 'Standup',
      scheduledFor: '2026-08-05',
      scheduledTime: '09:00',
      estimatedMinutes: 60,
    });
    let scheduleBody: Record<string, unknown> | undefined;
    server.use(
      http.get(`${API}/tasks`, () => HttpResponse.json(env({ items: [current] }))),
      http.patch(`${API}/tasks/t5/schedule`, async ({ request }) => {
        scheduleBody = (await request.json()) as Record<string, unknown>;
        current = { ...current, scheduledTime: scheduleBody['scheduledTime'] as string };
        return HttpResponse.json(env(current));
      })
    );
    renderComponent(<CalendarView now={NOW} />);

    const block = await screen.findByTestId('calendar-block-t5');
    // 09:00 sits at 432px; +96px of pointer travel is two hours.
    fireEvent.pointerDown(block, { button: 0, pointerId: 1, pointerType: 'mouse', clientY: 440 });
    fireEvent.pointerMove(block, { pointerId: 1, clientY: 536 });
    fireEvent.pointerUp(block, { pointerId: 1, clientY: 536 });

    await waitFor(() => expect(scheduleBody).toEqual({ scheduledFor: '2026-08-05', scheduledTime: '11:00' }));
    const wrapper = screen.getByTestId('calendar-block-wrapper-t5');
    await waitFor(() => expect(wrapper).toHaveStyle({ top: '528px' }));
  });

  it('rolls the block back and shows an error toast when the move fails', async () => {
    rangeReturns([
      makeTask({
        id: 't6',
        title: 'Standup',
        scheduledFor: '2026-08-05',
        scheduledTime: '09:00',
        estimatedMinutes: 60,
      }),
    ]);
    server.use(
      http.patch(`${API}/tasks/t6/schedule`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'boom' } }, { status: 500 })
      )
    );
    renderComponent(<CalendarView now={NOW} />);

    const block = await screen.findByTestId('calendar-block-t6');
    fireEvent.pointerDown(block, { button: 0, pointerId: 1, pointerType: 'mouse', clientY: 440 });
    fireEvent.pointerMove(block, { pointerId: 1, clientY: 536 });
    fireEvent.pointerUp(block, { pointerId: 1, clientY: 536 });

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    // The optimistic patch has been undone — the block is back at 09:00.
    await waitFor(() => expect(screen.getByTestId('calendar-block-wrapper-t6')).toHaveStyle({ top: '432px' }));
  });

  it("surfaces a free user's 403 as the upgrade prompt, not a generic error", async () => {
    rangeReturns([
      makeTask({
        id: 't7',
        title: 'Standup',
        scheduledFor: '2026-08-05',
        scheduledTime: '09:00',
        estimatedMinutes: 60,
      }),
    ]);
    server.use(
      http.patch(`${API}/tasks/t7/schedule`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'timed scheduling requires pro' } },
          { status: 403 }
        )
      )
    );
    renderComponent(<CalendarView now={NOW} />);

    const block = await screen.findByTestId('calendar-block-t7');
    fireEvent.pointerDown(block, { button: 0, pointerId: 1, pointerType: 'mouse', clientY: 440 });
    fireEvent.pointerMove(block, { pointerId: 1, clientY: 536 });
    fireEvent.pointerUp(block, { pointerId: 1, clientY: 536 });

    await waitFor(() => expect(screen.getByTestId('plan-limit-alert')).toBeInTheDocument());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('resize writes estimatedMinutes and never touches the schedule endpoint', async () => {
    let current = makeTask({
      id: 't8',
      title: 'Standup',
      scheduledFor: '2026-08-05',
      scheduledTime: '09:00',
      estimatedMinutes: 60,
    });
    let updateBody: Record<string, unknown> | undefined;
    let scheduleCalled = false;
    server.use(
      http.get(`${API}/tasks`, () => HttpResponse.json(env({ items: [current] }))),
      http.patch(`${API}/tasks/t8/schedule`, () => {
        scheduleCalled = true;
        return HttpResponse.json(env(current));
      }),
      http.patch(`${API}/tasks/t8`, async ({ request }) => {
        updateBody = (await request.json()) as Record<string, unknown>;
        current = { ...current, estimatedMinutes: updateBody['estimatedMinutes'] as number };
        return HttpResponse.json(env(current));
      })
    );
    renderComponent(<CalendarView now={NOW} />);

    await screen.findByTestId('calendar-block-t8');
    const handle = screen.getByTestId('calendar-resize-t8');
    // +48px on the bottom edge is one more hour of duration.
    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, pointerType: 'mouse', clientY: 480 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 528 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 528 });

    await waitFor(() => expect(updateBody).toEqual({ estimatedMinutes: 120 }));
    expect(scheduleCalled).toBe(false);
    await waitFor(() => expect(screen.getByTestId('calendar-block-wrapper-t8')).toHaveStyle({ height: '96px' }));
  });

  it('treats a sub-threshold wiggle as a click, not a reschedule', async () => {
    let mutated = false;
    rangeReturns([
      makeTask({
        id: 't9',
        title: 'Standup',
        scheduledFor: '2026-08-05',
        scheduledTime: '09:00',
        estimatedMinutes: 60,
      }),
    ]);
    server.use(
      http.patch(`${API}/tasks/t9/schedule`, () => {
        mutated = true;
        return HttpResponse.json(env(makeTask()));
      })
    );
    renderComponent(<CalendarView now={NOW} />);

    const block = await screen.findByTestId('calendar-block-t9');
    fireEvent.pointerDown(block, { button: 0, pointerId: 1, pointerType: 'mouse', clientY: 440 });
    fireEvent.pointerMove(block, { pointerId: 1, clientY: 442 });
    fireEvent.pointerUp(block, { pointerId: 1, clientY: 442 });

    expect(mutated).toBe(false);
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
