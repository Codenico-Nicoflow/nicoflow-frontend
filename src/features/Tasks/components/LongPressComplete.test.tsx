import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import TaskItem from './TaskItem';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const envelope = <T,>(data: T) => ({ data, error: null });

// ------------------------------------------------------------------
// Touch event helpers
// ------------------------------------------------------------------
const fireTouchStart = (el: Element, x = 150, y = 150) => {
  fireEvent.touchStart(el, { touches: [{ clientX: x, clientY: y, identifier: 1 }] });
};

const fireTouchEnd = (el: Element) => {
  fireEvent.touchEnd(el);
};

const fireTouchMove = (el: Element, x: number, y: number) => {
  fireEvent.touchMove(el, { touches: [{ clientX: x, clientY: y, identifier: 1 }] });
};

// Make the browser look touch-capable so the hook's guard passes.
const enableTouch = () => {
  Object.defineProperty(navigator, 'maxTouchPoints', { value: 1, writable: true, configurable: true });
};

const disableTouch = () => {
  Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true, configurable: true });
};

// ------------------------------------------------------------------
// Widened checkbox hit area
// ------------------------------------------------------------------
describe('TaskItem — widened checkbox hit area', () => {
  it('clicking the checkbox fires the status mutation (hit area is functional)', async () => {
    let patched = false;
    server.use(
      http.patch(`${API}/tasks/hit1/status`, () => {
        patched = true;
        return HttpResponse.json(envelope(makeTask({ id: 'hit1', status: 'done' })));
      })
    );

    const user = userEvent.setup();
    const task = makeTask({ id: 'hit1', status: 'active' });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('task-checkbox-hit1'));
    await waitFor(() => expect(patched).toBe(true));
  });
});

// ------------------------------------------------------------------
// Long-press-to-complete — timing controlled via fake timers
// ------------------------------------------------------------------
describe('TaskItem — long-press-to-complete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    enableTouch();
  });

  afterEach(() => {
    vi.useRealTimers();
    disableTouch();
  });

  it('fires completion after holding past the threshold', async () => {
    let patched = false;
    server.use(
      http.patch(`${API}/tasks/lp1/status`, () => {
        patched = true;
        return HttpResponse.json(envelope(makeTask({ id: 'lp1', status: 'done' })));
      })
    );

    const task = makeTask({ id: 'lp1', status: 'active' });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const wrapper = screen.getByTestId('task-long-press-lp1');
    fireTouchStart(wrapper);

    // Advance past the 500ms threshold.
    vi.advanceTimersByTime(501);

    // Switch back to real timers so MSW/RTK can resolve the network call.
    vi.useRealTimers();
    await waitFor(() => expect(patched).toBe(true), { timeout: 3000 });
  });

  it('does NOT fire when touch is released before the threshold', async () => {
    let patched = false;
    server.use(
      http.patch(`${API}/tasks/lp2/status`, () => {
        patched = true;
        return HttpResponse.json(envelope(makeTask({ id: 'lp2', status: 'done' })));
      })
    );

    const task = makeTask({ id: 'lp2', status: 'active' });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const wrapper = screen.getByTestId('task-long-press-lp2');
    fireTouchStart(wrapper, 100, 100);

    vi.advanceTimersByTime(300);
    fireTouchEnd(wrapper);

    // Advance past where the timer would have fired.
    vi.advanceTimersByTime(300);

    expect(patched).toBe(false);
  });

  it('does NOT fire when the finger moves beyond the scroll threshold before completion', async () => {
    let patched = false;
    server.use(
      http.patch(`${API}/tasks/lp3/status`, () => {
        patched = true;
        return HttpResponse.json(envelope(makeTask({ id: 'lp3', status: 'done' })));
      })
    );

    const task = makeTask({ id: 'lp3', status: 'active' });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const wrapper = screen.getByTestId('task-long-press-lp3');
    fireTouchStart(wrapper, 100, 100);
    // Move >10px vertically — exceeds movement threshold, cancels the gesture.
    fireTouchMove(wrapper, 100, 120);

    vi.advanceTimersByTime(501);
    fireTouchEnd(wrapper);

    expect(patched).toBe(false);
  });

  it('does NOT fire on a non-touch device (zero maxTouchPoints, no ontouchstart)', async () => {
    disableTouch();

    let patched = false;
    server.use(
      http.patch(`${API}/tasks/lp4/status`, () => {
        patched = true;
        return HttpResponse.json(envelope(makeTask({ id: 'lp4', status: 'done' })));
      })
    );

    const task = makeTask({ id: 'lp4', status: 'active' });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const wrapper = screen.getByTestId('task-long-press-lp4');
    fireTouchStart(wrapper);

    vi.advanceTimersByTime(501);

    expect(patched).toBe(false);
  });

  it('routes long-press through the subtask confirm gate when open subtasks exist', async () => {
    const task = makeTask({ id: 'lp6', status: 'active', subtaskCount: 2, openSubtaskCount: 2 });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const wrapper = screen.getByTestId('task-long-press-lp6');
    fireTouchStart(wrapper);

    vi.advanceTimersByTime(501);

    // The confirm dialog should appear — long-press routed through guardComplete.
    vi.useRealTimers();
    await waitFor(() => expect(screen.queryByText(/unfinished subtasks/i)).toBeInTheDocument(), { timeout: 2000 });
  });

  it('does not fire long-press when the task is already completed', async () => {
    let patched = false;
    server.use(
      http.patch(`${API}/tasks/lp7/status`, () => {
        patched = true;
        return HttpResponse.json(envelope(makeTask({ id: 'lp7', status: 'active' })));
      })
    );

    const task = makeTask({ id: 'lp7', status: 'done' });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const wrapper = screen.getByTestId('task-long-press-lp7');
    fireTouchStart(wrapper);

    vi.advanceTimersByTime(501);

    expect(patched).toBe(false);
  });
});

// ------------------------------------------------------------------
// Quick tap still opens edit (no fake timers needed — quick taps
// resolve before the 500ms threshold regardless)
// ------------------------------------------------------------------
describe('TaskItem — quick tap opens edit (touch does not block click)', () => {
  it('a click on the card still calls onEdit', async () => {
    const onEdit = vi.fn();
    const task = makeTask({ id: 'lp5', status: 'active' });
    const user = userEvent.setup();
    renderComponent(<TaskItem task={task} index={0} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('task-card-lp5'));
    expect(onEdit).toHaveBeenCalledWith(task);
  });
});
