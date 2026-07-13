import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, subDays } from 'date-fns';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

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

  it('moves the task to someday from the three-dot menu', async () => {
    let patchedStatus: unknown;
    server.use(
      http.patch(`${API}/tasks/t4/status`, async ({ request }) => {
        const body = (await request.json()) as { status: string };
        patchedStatus = body.status;
        return HttpResponse.json(envelope(makeTask({ id: 't4', status: 'someday' })));
      })
    );

    const user = userEvent.setup();
    renderComponent(
      <TaskItem task={makeTask({ id: 't4', status: 'active' })} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    await user.click(screen.getByTestId('item-actions-menu-trigger'));
    await user.click(await screen.findByText('Move to Someday'));

    await waitFor(() => expect(patchedStatus).toBe('someday'));
  });
});
