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
  makeTask({ id: 's', title: 'Someday low task', status: 'someday', energy: 'low', displayOrder: 1 }),
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

  it('filters by Someday status', async () => {
    mountList();
    const user = userEvent.setup();
    renderComponent(<TasksSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Active deep task')).toBeInTheDocument());
    await user.click(screen.getByTestId('task-filter-someday'));

    expect(screen.getByText('Someday low task')).toBeInTheDocument();
    expect(screen.queryByText('Active deep task')).not.toBeInTheDocument();
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
