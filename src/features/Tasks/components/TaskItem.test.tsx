import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, subDays } from 'date-fns';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { CONFIRM_DIALOG_CANCEL_BUTTON, CONFIRM_DIALOG_CONFIRM_BUTTON } from '@/lib/test_ids';
import { makeTask } from '@/mocks/handlers';

import TaskItem from './TaskItem';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const envelope = <T,>(data: T) => ({ data, error: null });

describe('TaskItem', () => {
  it('renders the energy glyph for the task', () => {
    renderComponent(
      <TaskItem task={makeTask({ id: 't1', energy: 'deep' })} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    // TaskBadges renders for both mobile + desktop breakpoints, so expect ≥1.
    expect(screen.getAllByTestId('task-energy-deep').length).toBeGreaterThanOrEqual(1);
  });

  it('shows a neutral "carried over" chip (never red) for a past soft scheduledFor', () => {
    const task = makeTask({ id: 't2', scheduledFor: format(subDays(new Date(), 4), 'yyyy-MM-dd') });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const chips = screen.getAllByTestId('task-date-carriedOver');
    expect(chips.length).toBeGreaterThanOrEqual(1);
    chips.forEach(chip => expect(chip.className).not.toMatch(/red/));
  });

  it('optimistically toggles status and rolls back on failure', async () => {
    server.use(
      http.patch(`${API}/tasks/t3/status`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'boom' } }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderComponent(
      <TaskItem task={makeTask({ id: 't3', status: 'active' })} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    const checkbox = screen.getByTestId('task-checkbox-t3');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    // Optimistic flip then rollback once the 500 returns.
    await waitFor(() => expect(screen.getByTestId('task-checkbox-t3')).not.toBeChecked());
  });

  it('opens the edit dialog when the card is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const task = makeTask({ id: 't5' });
    renderComponent(<TaskItem task={task} index={0} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('task-card-t5'));
    expect(onEdit).toHaveBeenCalledWith(task);
  });

  it('opens the edit dialog when the card is activated with the keyboard', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const task = makeTask({ id: 't6' });
    renderComponent(<TaskItem task={task} index={0} onEdit={onEdit} onDelete={vi.fn()} />);

    screen.getByTestId('task-card-t6').focus();
    await user.keyboard('{Enter}');
    expect(onEdit).toHaveBeenCalledWith(task);
  });

  it('does not open edit when the checkbox is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    renderComponent(
      <TaskItem task={makeTask({ id: 't7', status: 'active' })} index={0} onEdit={onEdit} onDelete={vi.fn()} />
    );

    await user.click(screen.getByTestId('task-checkbox-t7'));
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('does not open edit when the actions menu is opened', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    renderComponent(<TaskItem task={makeTask({ id: 't8' })} index={0} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('item-actions-menu-trigger'));
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('completes straight away when no subtask is open', async () => {
    let patched = false;
    server.use(
      http.patch(`${API}/tasks/t9/status`, () => {
        patched = true;
        return HttpResponse.json(envelope(makeTask({ id: 't9', status: 'done' })));
      })
    );

    const user = userEvent.setup();
    const task = makeTask({ id: 't9', status: 'active', subtaskCount: 2, openSubtaskCount: 0 });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('task-checkbox-t9'));

    await waitFor(() => expect(patched).toBe(true));
    expect(screen.queryByTestId(CONFIRM_DIALOG_CONFIRM_BUTTON)).not.toBeInTheDocument();
  });

  it('asks before completing a task that still has open subtasks', async () => {
    let patched = false;
    server.use(
      http.patch(`${API}/tasks/t10/status`, () => {
        patched = true;
        return HttpResponse.json(envelope(makeTask({ id: 't10', status: 'done' })));
      })
    );

    const user = userEvent.setup();
    const task = makeTask({ id: 't10', status: 'active', subtaskCount: 3, openSubtaskCount: 2 });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('task-checkbox-t10'));

    expect(await screen.findByText(/2 unfinished subtasks/)).toBeInTheDocument();
    expect(patched).toBe(false);

    await user.click(screen.getByTestId(CONFIRM_DIALOG_CONFIRM_BUTTON));
    await waitFor(() => expect(patched).toBe(true));
  });

  it('leaves the task alone when the completion is cancelled', async () => {
    let patched = false;
    server.use(
      http.patch(`${API}/tasks/t11/status`, () => {
        patched = true;
        return HttpResponse.json(envelope(makeTask({ id: 't11', status: 'done' })));
      })
    );

    const user = userEvent.setup();
    const task = makeTask({ id: 't11', status: 'active', subtaskCount: 1, openSubtaskCount: 1 });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('task-checkbox-t11'));
    await user.click(await screen.findByTestId(CONFIRM_DIALOG_CANCEL_BUTTON));

    await waitFor(() => expect(screen.queryByTestId(CONFIRM_DIALOG_CANCEL_BUTTON)).not.toBeInTheDocument());
    expect(patched).toBe(false);
    expect(screen.getByTestId('task-checkbox-t11')).not.toBeChecked();
  });

  it('does not ask when reopening a completed task with open subtasks', async () => {
    let patchedStatus: unknown;
    server.use(
      http.patch(`${API}/tasks/t12/status`, async ({ request }) => {
        const body = (await request.json()) as { status: string };
        patchedStatus = body.status;
        return HttpResponse.json(envelope(makeTask({ id: 't12', status: 'active' })));
      })
    );

    const user = userEvent.setup();
    const task = makeTask({ id: 't12', status: 'done', subtaskCount: 2, openSubtaskCount: 2 });
    renderComponent(<TaskItem task={task} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('task-checkbox-t12'));

    await waitFor(() => expect(patchedStatus).toBe('active'));
    expect(screen.queryByTestId(CONFIRM_DIALOG_CONFIRM_BUTTON)).not.toBeInTheDocument();
  });

  it('cancels the task from the three-dot menu', async () => {
    let patchedStatus: unknown;
    server.use(
      http.patch(`${API}/tasks/t4/status`, async ({ request }) => {
        const body = (await request.json()) as { status: string };
        patchedStatus = body.status;
        return HttpResponse.json(envelope(makeTask({ id: 't4', status: 'cancelled' })));
      })
    );

    const user = userEvent.setup();
    renderComponent(
      <TaskItem task={makeTask({ id: 't4', status: 'active' })} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    await user.click(screen.getByTestId('item-actions-menu-trigger'));
    await user.click(await screen.findByText('Cancel Task'));

    await waitFor(() => expect(patchedStatus).toBe('cancelled'));
  });

  it('shows Skip and End-series menu items instead of Delete when recurrenceRuleId is set', async () => {
    const recurringTask = makeTask({ id: 't-rec', recurrenceRuleId: 'rule-1' });
    const user = userEvent.setup();
    renderComponent(<TaskItem task={recurringTask} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('item-actions-menu-trigger'));

    expect(await screen.findByText(/skip this occurrence/i)).toBeInTheDocument();
    expect(screen.getByText(/end series/i)).toBeInTheDocument();
    expect(screen.queryByText(/delete task/i)).not.toBeInTheDocument();
  });

  it('shows plain Delete (not Skip/End-series) when recurrenceRuleId is absent', async () => {
    const plainTask = makeTask({ id: 't-plain' });
    const user = userEvent.setup();
    renderComponent(<TaskItem task={plainTask} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('item-actions-menu-trigger'));

    expect(await screen.findByText(/delete task/i)).toBeInTheDocument();
    expect(screen.queryByText(/skip this occurrence/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/end series/i)).not.toBeInTheDocument();
  });
});
