import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { makeTask, makeUser } from '@/mocks/handlers';

import CalendarView from './index';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

// Fixed clock so the now-line and the default anchor never depend on the day
// the suite happens to run.
const NOW = new Date(2026, 7, 5, 10, 30); // Wed 2026-08-05

// Timed scheduling is Pro; a free user gets the locked teaser instead of the
// grid, so every interactive case signs in as Pro explicitly.
const asPlan = (status: 'premium' | 'regular') =>
  createMockStore({ auth: { user: makeUser({ status }), token: 't', isLoading: false } });

const renderCalendar = (options?: { status?: 'premium' | 'regular'; initialRoute?: string }) =>
  renderComponent(<CalendarView now={NOW} />, {
    store: asPlan(options?.status ?? 'premium'),
    ...(options?.initialRoute ? { initialRoute: options.initialRoute } : {}),
  });

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
    renderCalendar();

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
    renderCalendar();

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
    renderCalendar();

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

    renderCalendar();

    const block = await screen.findByTestId('calendar-block-t2');
    expect(block).toHaveAttribute('data-unestimated', 'true');
    expect(screen.getByTestId('calendar-block-wrapper-t2')).toHaveStyle({ height: '24px' });
    expect(patched).toBe(false);
  });

  it('puts untimed tasks in the all-day rail rather than the hour grid', async () => {
    rangeReturns([makeTask({ id: 't3', title: 'Read the RFC', scheduledFor: '2026-08-05', scheduledTime: null })]);
    renderCalendar();

    await waitFor(() => expect(screen.getByTestId('calendar-allday-task-t3')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-block-t3')).not.toBeInTheDocument();
  });

  it('splits width between two tasks at the same time', async () => {
    rangeReturns([
      makeTask({ id: 'a', title: 'A', scheduledFor: '2026-08-05', scheduledTime: '09:00', estimatedMinutes: 60 }),
      makeTask({ id: 'b', title: 'B', scheduledFor: '2026-08-05', scheduledTime: '09:00', estimatedMinutes: 60 }),
    ]);
    renderCalendar();

    await screen.findByTestId('calendar-block-a');
    expect(screen.getByTestId('calendar-block-wrapper-a')).toHaveStyle({ width: '50%' });
    expect(screen.getByTestId('calendar-block-wrapper-b')).toHaveStyle({ width: '50%' });
  });

  it('restores view and date from the URL', async () => {
    rangeReturns([]);
    renderCalendar({ initialRoute: '/calendar?view=day&date=2026-08-20' });

    await waitFor(() => expect(screen.getByTestId('calendar-day-2026-08-20')).toBeInTheDocument());
    // Day view renders exactly one column.
    expect(screen.queryByTestId('calendar-day-2026-08-21')).not.toBeInTheDocument();
  });

  it('writes view changes back to the URL so the grid is shareable', async () => {
    const user = userEvent.setup();
    rangeReturns([]);
    renderCalendar();

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
    renderCalendar();

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
    renderCalendar();

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
    renderCalendar();

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
    renderCalendar();

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
    renderCalendar();

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
    renderCalendar();

    await user.click(await screen.findByTestId('calendar-block-t4'));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(within(screen.getByRole('dialog')).getByDisplayValue('Standup')).toBeInTheDocument();
  });
});

describe('CalendarView — Pro gate', () => {
  it('shows a free user their own month behind the teaser instead of the grid', async () => {
    rangeReturns([
      makeTask({ id: 'l1', title: 'Standup', scheduledFor: '2026-08-05', scheduledTime: '09:00' }),
      makeTask({ id: 'l2', title: 'Design review', scheduledFor: '2026-08-12', scheduledTime: '11:00' }),
    ]);
    renderCalendar({ status: 'regular' });

    await waitFor(() => expect(screen.getByTestId('calendar-teaser')).toBeInTheDocument());
    // Real data, not a placeholder: the user's own chips are what is blurred.
    expect(within(screen.getByTestId('calendar-teaser-grid')).getByText('Standup')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-teaser-cta')).toBeInTheDocument();
    // No hour grid means no drag surface at all.
    expect(screen.queryByTestId('calendar-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('calendar-block-l1')).not.toBeInTheDocument();
  });

  it('keeps the blurred chrome out of reach of pointer and keyboard', async () => {
    rangeReturns([makeTask({ id: 'l3', title: 'Standup', scheduledFor: '2026-08-05', scheduledTime: '09:00' })]);
    renderCalendar({ status: 'regular' });

    const blurred = await screen.findByTestId('calendar-teaser-grid');
    expect(blurred).toHaveAttribute('inert');
    expect(blurred).toHaveAttribute('aria-hidden', 'true');
  });

  it('drops the view switcher for a locked user — one shape, no dead buttons', async () => {
    rangeReturns([]);
    renderCalendar({ status: 'regular' });

    await waitFor(() => expect(screen.getByTestId('calendar-teaser')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-view-day')).not.toBeInTheDocument();
    // Stepping months still works: browsing your own locked data is the point.
    expect(screen.getByTestId('calendar-prev')).toBeInTheDocument();
  });

  it('renders no teaser at all for a pro user', async () => {
    rangeReturns([makeTask({ id: 'l4', title: 'Standup', scheduledFor: '2026-08-05', scheduledTime: '09:00' })]);
    renderCalendar();

    await screen.findByTestId('calendar-block-l4');
    expect(screen.queryByTestId('calendar-teaser')).not.toBeInTheDocument();
  });

  it('ignores a day-view URL while locked rather than fetching a range it never draws', async () => {
    let url: URL | undefined;
    rangeReturns([], captured => {
      url = captured;
    });
    renderCalendar({ status: 'regular', initialRoute: '/calendar?view=day&date=2026-08-05' });

    await waitFor(() => expect(url).toBeDefined());
    // The whole padded month, not the single day the param asked for.
    expect(url!.searchParams.get('scheduledFrom')).toBe('2026-07-27');
  });
});
