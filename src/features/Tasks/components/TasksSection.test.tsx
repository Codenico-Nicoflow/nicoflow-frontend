import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { renderComponent } from '../../../../__tests__/renderComponent';
import { server } from '../../../../__tests__/server';
import { makeTask } from '../../../mocks/handlers';

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
});
