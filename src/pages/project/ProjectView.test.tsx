import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { makeTask, mockProject } from '@/mocks/handlers';

import ProjectView from './ProjectView';

const PROJECT_URL = 'http://localhost:8080/v1/projects/project-1';
const envelope = <T,>(data: T) => ({ data, error: null });

const renderAt = (search = '') =>
  renderComponent(
    <Routes>
      <Route path="/projects/:projectId" element={<ProjectView />} />
    </Routes>,
    { initialRoute: `/projects/project-1${search}` }
  );

describe('ProjectView', () => {
  it('renders the project header and description on success', async () => {
    server.use(http.get(PROJECT_URL, () => HttpResponse.json(envelope(mockProject))));

    renderAt();

    expect(await screen.findByText('Redesign')).toBeInTheDocument();
    expect(screen.getByTestId('project-description')).toBeInTheDocument();
    expect(screen.getByText(/Revamp the areas/)).toBeInTheDocument();
  });

  it('shows a not-found state when the project does not exist', async () => {
    server.use(
      http.get(PROJECT_URL, () =>
        HttpResponse.json({ data: null, error: { code: 'PROJECT_NOT_FOUND', message: 'not found' } }, { status: 404 })
      )
    );

    renderAt();

    expect(await screen.findByTestId('project-not-found')).toBeInTheDocument();
  });
});

describe('ProjectView tabs', () => {
  beforeEach(() => {
    server.use(http.get(PROJECT_URL, () => HttpResponse.json(envelope(mockProject))));
  });

  it('opens on tasks and keeps notes out of view', async () => {
    renderAt();

    expect(await screen.findByTestId('project-tab-tasks')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('project-tab-notes')).toHaveAttribute('aria-selected', 'false');
  });

  it('opens on notes when the url asks for them', async () => {
    renderAt('?tab=notes');

    expect(await screen.findByTestId('project-tab-notes')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('project-tab-tasks')).toHaveAttribute('aria-selected', 'false');
  });

  // A hand-edited or stale param must not leave the page with no panel showing.
  it('falls back to tasks for an unknown tab', async () => {
    renderAt('?tab=nonsense');

    expect(await screen.findByTestId('project-tab-tasks')).toHaveAttribute('aria-selected', 'true');
  });

  it('records the tab in the url when switched', async () => {
    const user = userEvent.setup();
    renderAt();

    await user.click(await screen.findByTestId('project-tab-notes'));

    expect(await screen.findByTestId('project-tab-notes')).toHaveAttribute('aria-selected', 'true');
    expect(window.location.search).toContain('tab=notes');
  });

  // The tab label is the section's title now, so the sections must not print it
  // a second time inside the panel.
  it('does not repeat the tab label as a heading inside the panel', async () => {
    renderAt('?tab=notes');

    await screen.findByTestId('project-tab-notes');
    expect(screen.queryByRole('heading', { name: 'Notes' })).not.toBeInTheDocument();
  });
});

describe('ProjectView task deep-link', () => {
  const API = 'http://localhost:8080/v1';
  const items = <T,>(list: T[]) => ({ data: { items: list, nextCursor: '' }, error: null });

  beforeEach(() => {
    server.use(
      http.get(PROJECT_URL, () => HttpResponse.json(envelope(mockProject))),
      http.get(`${API}/projects/project-1/tasks`, () =>
        HttpResponse.json(items([makeTask({ id: 'task-99', title: 'Deep-link task' })]))
      ),
      http.get(`${API}/tasks/task-99/subtasks`, () => HttpResponse.json(items([])))
    );
  });

  it('forces the tasks tab when ?task= is present', async () => {
    renderAt('?tab=notes&task=task-99');

    // Even though ?tab=notes is in the URL, the tasks tab must be active.
    expect(await screen.findByTestId('project-tab-tasks')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('project-tab-notes')).toHaveAttribute('aria-selected', 'false');
  });

  it('auto-opens the task dialog when the task is loaded', async () => {
    renderAt('?task=task-99');

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Edit Task' })).toBeInTheDocument());
  });
});
