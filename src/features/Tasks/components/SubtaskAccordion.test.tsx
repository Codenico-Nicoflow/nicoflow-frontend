import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { makeSubtask } from '@/mocks/handlers';

import { SubtaskAccordion } from './SubtaskAccordion';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });
const TASK = 'task-1';

const listOf = (...subs: ReturnType<typeof makeSubtask>[]) =>
  http.get(`${API}/tasks/${TASK}/subtasks`, () => HttpResponse.json(env({ items: subs })));

describe('SubtaskAccordion', () => {
  it('lists subtasks ordered by position', async () => {
    server.use(
      listOf(
        makeSubtask({ id: 's2', title: 'Second', position: 1 }),
        makeSubtask({ id: 's1', title: 'First', position: 0 })
      )
    );

    renderComponent(<SubtaskAccordion taskId={TASK} />);

    await waitFor(() => expect(screen.getByText('First')).toBeInTheDocument());
    const rows = screen.getAllByTestId(/^subtask-row-/);
    expect(within(rows[0]!).getByText('First')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Second')).toBeInTheDocument();
  });

  it('shows an empty state when there are no subtasks', async () => {
    server.use(listOf());
    renderComponent(<SubtaskAccordion taskId={TASK} />);
    expect(await screen.findByTestId('subtask-empty')).toBeInTheDocument();
  });

  it('adds a subtask — POSTs the title, then clears the input', async () => {
    let posted: unknown;
    server.use(
      listOf(),
      http.post(`${API}/tasks/${TASK}/subtasks`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json(env(makeSubtask({ id: 's-new', title: 'Buy milk' })));
      })
    );

    const user = userEvent.setup();
    renderComponent(<SubtaskAccordion taskId={TASK} />);

    const input = await screen.findByTestId('subtask-add-input');
    await user.type(input, 'Buy milk');
    await user.click(screen.getByTestId('subtask-add-button'));

    await waitFor(() => expect(posted).toEqual({ title: 'Buy milk' }));
    await waitFor(() => expect(screen.getByTestId('subtask-add-input')).toHaveValue(''));
  });

  it('toggles a subtask done — PATCHes { done: true }', async () => {
    let patched: unknown;
    server.use(
      listOf(makeSubtask({ id: 's1', title: 'Toggle me', done: false })),
      http.patch(`${API}/tasks/${TASK}/subtasks/s1`, async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json(env(makeSubtask({ id: 's1', done: true })));
      })
    );

    const user = userEvent.setup();
    renderComponent(<SubtaskAccordion taskId={TASK} />);

    await user.click(await screen.findByTestId('subtask-checkbox-s1'));
    await waitFor(() => expect(patched).toEqual({ done: true }));
  });

  it('deletes a subtask — DELETEs the row', async () => {
    let deleted = false;
    server.use(
      listOf(makeSubtask({ id: 's1', title: 'Remove me' })),
      http.delete(`${API}/tasks/${TASK}/subtasks/s1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderComponent(<SubtaskAccordion taskId={TASK} />);

    await user.click(await screen.findByTestId('subtask-delete-s1'));
    await waitFor(() => expect(deleted).toBe(true));
  });
});
