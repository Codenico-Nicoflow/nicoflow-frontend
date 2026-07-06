import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderComponent } from '../../../../__tests__/renderComponent';
import { server } from '../../../../__tests__/server';
import { makeTask } from '../../../mocks/handlers';

import TasksSection from './TasksSection';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const items = <T,>(list: T[]) => ({ data: { items: list }, error: null });

describe('TaskQuickAdd (in TasksSection)', () => {
  it('creates a title-only task on Enter and shows it in the list', async () => {
    // Stateful list: the POST appends, the refetch after invalidation returns it.
    const list = [makeTask({ id: 'a', title: 'Existing task', status: 'active', displayOrder: 0 })];
    server.use(
      http.get(`${API}/projects/p1/tasks`, () => HttpResponse.json(items(list))),
      http.post(`${API}/projects/p1/tasks`, async ({ request }) => {
        const body = (await request.json()) as { title: string };
        const created = makeTask({ id: 'new', title: body.title, displayOrder: list.length });
        list.push(created);
        return HttpResponse.json({ data: created, error: null }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Existing task')).toBeInTheDocument());
    await user.type(screen.getByTestId('task-quick-add'), 'Buy oat milk{Enter}');

    await waitFor(() => expect(screen.getByText('Buy oat milk')).toBeInTheDocument());
    expect(screen.getByTestId('task-quick-add')).toHaveValue('');
  });

  it('shows the on-brand upgrade copy on 403 PLAN_LIMIT_EXCEEDED, not a generic error', async () => {
    server.use(
      http.get(`${API}/projects/p1/tasks`, () =>
        HttpResponse.json(items([makeTask({ id: 'a', title: 'Existing task', displayOrder: 0 })]))
      ),
      http.post(`${API}/projects/p1/tasks`, () =>
        HttpResponse.json({ data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'limit' } }, { status: 403 })
      )
    );

    const user = userEvent.setup();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Existing task')).toBeInTheDocument());
    await user.type(screen.getByTestId('task-quick-add'), 'One too many{Enter}');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Someday')));
    // The input keeps the title so the user can park something else instead.
    expect(screen.getByTestId('task-quick-add')).toHaveValue('One too many');
  });
});
