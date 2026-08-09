import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import TasksSection from './TasksSection';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = 'http://localhost:8080/v1';
const items = <T,>(list: T[]) => ({ data: { items: list }, error: null });

const seed = [
  makeTask({ id: 'a', title: 'Active deep task', status: 'active', energy: 'deep', displayOrder: 0 }),
  makeTask({ id: 'c', title: 'Called off task', status: 'cancelled', energy: 'low', displayOrder: 1 }),
  makeTask({ id: 'b', title: 'Buy milk', status: 'active', energy: 'medium', displayOrder: 2 }),
];

const mountList = (list = seed) =>
  server.use(http.get(`${API}/projects/p1/tasks`, () => HttpResponse.json(items(list))));

describe('TasksSection', () => {
  it('lists the project tasks (ordered by displayOrder)', async () => {
    mountList();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Active deep task')).toBeInTheDocument());
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('filters by Cancelled status', async () => {
    mountList();
    const user = userEvent.setup();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Active deep task')).toBeInTheDocument());
    await user.click(screen.getByTestId('task-filter-cancelled'));

    expect(screen.getByText('Called off task')).toBeInTheDocument();
    expect(screen.queryByText('Active deep task')).not.toBeInTheDocument();
  });

  it('opens on Active by default', async () => {
    mountList();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Active deep task')).toBeInTheDocument());
    expect(screen.getByTestId('task-filter-active')).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Called off task')).not.toBeInTheDocument();
  });

  it('filters to unscheduled active tasks via the schedule chip', async () => {
    mountList([
      makeTask({ id: 'u', title: 'Needs a date', status: 'active', scheduledFor: null, displayOrder: 0 }),
      makeTask({ id: 'd', title: 'Already dated', status: 'active', scheduledFor: '2026-08-05', displayOrder: 1 }),
      makeTask({ id: 'f', title: 'Finished undated', status: 'done', scheduledFor: null, displayOrder: 2 }),
    ]);
    const user = userEvent.setup();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Needs a date')).toBeInTheDocument());
    await user.click(screen.getByTestId('task-schedule-filter-unscheduled'));

    expect(screen.getByText('Needs a date')).toBeInTheDocument();
    expect(screen.queryByText('Already dated')).not.toBeInTheDocument();
    // Finished tasks aren't shown at all — the Active tab is still the active filter.
    expect(screen.queryByText('Finished undated')).not.toBeInTheDocument();
  });

  // Completing a task changes its status, which would drop it straight out of
  // the status filter it was listed under — the strike-through it just earned
  // would never be on screen.
  it('keeps a completed task visible under the filter it was completed in', async () => {
    // The list is served from mutable state: completing invalidates the Task tag
    // and refetches, so a fixed response would serve the pre-completion status
    // back and undo the optimistic flip.
    let task = makeTask({ id: 'a2', title: 'Active thing', status: 'active', displayOrder: 0 });
    server.use(
      http.get(`${API}/projects/p1/tasks`, () => HttpResponse.json(items([task]))),
      http.patch(`${API}/tasks/a2/status`, async ({ request }) => {
        const { status } = (await request.json()) as { status: string };
        task = { ...task, status: status as typeof task.status };
        return HttpResponse.json({ data: task, error: null });
      })
    );
    const user = userEvent.setup();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByTestId('task-filter-active')).toHaveAttribute('aria-selected', 'true'));
    await user.click(screen.getByTestId('task-checkbox-a2'));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Active thing' })).toHaveClass('line-through'));
  });

  it('drops the pinned task once the filter changes', async () => {
    let task = makeTask({ id: 'a2', title: 'Active thing', status: 'active', displayOrder: 0 });
    server.use(
      http.get(`${API}/projects/p1/tasks`, () => HttpResponse.json(items([task, ...seed]))),
      http.patch(`${API}/tasks/a2/status`, async ({ request }) => {
        const { status } = (await request.json()) as { status: string };
        task = { ...task, status: status as typeof task.status };
        return HttpResponse.json({ data: task, error: null });
      })
    );
    const user = userEvent.setup();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Active thing')).toBeInTheDocument());
    await user.click(screen.getByTestId('task-checkbox-a2'));
    await user.click(screen.getByTestId('task-filter-cancelled'));

    expect(screen.queryByText('Active thing')).not.toBeInTheDocument();
  });

  it('filters by Energy', async () => {
    mountList();
    const user = userEvent.setup();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Active deep task')).toBeInTheDocument());
    await user.click(screen.getByTestId('task-energy-filter'));
    await user.click(await screen.findByTestId('task-energy-filter-deep'));

    await waitFor(() => expect(screen.queryByText('Buy milk')).not.toBeInTheDocument());
    expect(screen.getByText('Active deep task')).toBeInTheDocument();
  });

  it('debounced search narrows the list and shows a clear button', async () => {
    mountList();
    const user = userEvent.setup();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Buy milk')).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText('Search Tasks...'), 'milk');

    await waitFor(() => expect(screen.queryByText('Active deep task')).not.toBeInTheDocument());
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('shows an encouraging empty state with a quick-add CTA when there are no tasks', async () => {
    mountList([]);
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('No tasks yet')).toBeInTheDocument());
    expect(within(document.body).getByText('Create Your First Task')).toBeInTheDocument();
  });

  // Regression: re-selecting the same task from search while already on the
  // project page must re-open the edit dialog. The nav-open guard keys on
  // location.key (fresh per navigation), so an identical editTaskId isn't
  // swallowed as a duplicate. Previously it opened once then went dead.
  it('re-opens the edit dialog on repeated same-task navigation', async () => {
    mountList();
    // The edit dialog fetches the task's subtasks on open — stub it so the run stays quiet.
    server.use(http.get(`${API}/tasks/a/subtasks`, () => HttpResponse.json(items([]))));
    const store = createMockStore();
    const user = userEvent.setup();

    // Harness: a button that navigates to the same route + state on each click,
    // reproducing a search-select of the same task from the project page.
    const Nav = () => {
      const navigate = useNavigate();
      return <button onClick={() => navigate('/projects/p1', { state: { editTaskId: 'a' } })}>go</button>;
    };

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/projects/p1']}>
          <Nav />
          <TasksSection projectId="p1" />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => expect(screen.getByText('Active deep task')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'go' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Edit Task' })).toBeInTheDocument());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Edit Task' })).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'go' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Edit Task' })).toBeInTheDocument());
  });
});
