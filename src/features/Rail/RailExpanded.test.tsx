import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { areaApi, invalidateApiTags } from '@/lib/store';
import { PROJECT_STATUS } from '@/lib/types';
import { makeArea, makeProject } from '@/mocks/handlers';

import { Rail } from './index';

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

const withTree = (areas: unknown[]) =>
  server.use(http.get(`${API}/areas/with-projects`, () => HttpResponse.json(env(areas))));

const expandedStorage = (closedAreaIds: string[] = []) =>
  window.localStorage.setItem('nicoflow-rail', JSON.stringify({ expanded: true, closedAreaIds }));

const workArea = (projects = [makeProject({ id: 'p1', name: 'Launch', areaId: 'area-1' })]) => ({
  ...makeArea({ id: 'area-1', name: 'Work' }),
  projects,
});

beforeEach(() => window.localStorage.clear());

const collapsedStorage = () =>
  window.localStorage.setItem('nicoflow-rail', JSON.stringify({ expanded: false, closedAreaIds: [] }));

describe('Rail expansion', () => {
  it('starts expanded with no stored preference, showing labels and the tree', async () => {
    withTree([workArea()]);
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    expect(screen.getByTestId('rail-toggle')).toHaveAttribute('aria-expanded', 'true');
    expect(within(screen.getByTestId('rail-areas')).getByText('Areas')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('rail-tree')).toBeInTheDocument());
  });

  it('collapses on toggle and hides the tree', async () => {
    withTree([workArea()]);
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });
    await waitFor(() => expect(screen.getByTestId('rail-tree')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('rail-toggle'));

    expect(screen.getByTestId('rail-toggle')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('rail-tree')).not.toBeInTheDocument();
  });

  it('persists the collapsed choice to storage', async () => {
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await userEvent.click(screen.getByTestId('rail-toggle'));

    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('nicoflow-rail') ?? '{}').expanded).toBe(false));
  });

  it('restores a stored collapsed state on mount', () => {
    collapsedStorage();
    withTree([workArea()]);

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    expect(screen.getByTestId('rail-toggle')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('rail-tree')).not.toBeInTheDocument();
  });

  it('restores a stored expanded state on mount', async () => {
    expandedStorage();
    withTree([workArea()]);

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    expect(screen.getByTestId('rail-toggle')).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(screen.getByTestId('rail-tree')).toBeInTheDocument());
  });

  it('falls back to the expanded default when stored state is malformed', () => {
    window.localStorage.setItem('nicoflow-rail', 'not json');
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });
    expect(screen.getByTestId('rail-toggle')).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Rail tree', () => {
  beforeEach(() => expandedStorage());

  it('lists active projects under their area', async () => {
    withTree([
      workArea([
        makeProject({ id: 'p1', name: 'Launch', areaId: 'area-1' }),
        makeProject({ id: 'p2', name: 'Archived one', areaId: 'area-1', status: PROJECT_STATUS.ARCHIVED }),
      ]),
    ]);

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.getByTestId('rail-project-p1')).toBeInTheDocument());
    expect(screen.queryByTestId('rail-project-p2')).not.toBeInTheDocument();
  });

  it('shows a skeleton while the tree loads', () => {
    withTree([workArea()]);
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });
    expect(screen.getByTestId('rail-tree-skeleton')).toBeInTheDocument();
  });

  it('renders nothing when the user has no areas', async () => {
    withTree([]);
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.queryByTestId('rail-tree-skeleton')).not.toBeInTheDocument());
    expect(screen.queryByTestId('rail-tree')).not.toBeInTheDocument();
  });

  it('stays silent when the tree query fails', async () => {
    server.use(http.get(`${API}/areas/with-projects`, () => HttpResponse.json(env(null), { status: 500 })));
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.queryByTestId('rail-tree-skeleton')).not.toBeInTheDocument());
    expect(screen.queryByTestId('rail-tree')).not.toBeInTheDocument();
  });

  it('drops the tree rather than showing stale areas when a refetch fails', async () => {
    let failing = false;
    server.use(
      http.get(`${API}/areas/with-projects`, () =>
        failing ? HttpResponse.json(env(null), { status: 500 }) : HttpResponse.json(env([workArea()]))
      )
    );

    const store = createMockStore();
    renderComponent(<Rail />, { initialRoute: '/quick-access/today', store });
    await waitFor(() => expect(screen.getByTestId('rail-project-p1')).toBeInTheDocument());

    // RTK Query keeps the last good payload on a failed refetch, so without an
    // explicit error guard the rail would keep serving a tree it can't verify.
    failing = true;
    invalidateApiTags(store.dispatch, areaApi, ['Area'] as const);

    await waitFor(() => expect(screen.queryByTestId('rail-tree')).not.toBeInTheDocument());
  });

  it('collapses an area and remembers it', async () => {
    withTree([workArea()]);
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    const header = await screen.findByTestId('rail-area-area-1');
    expect(header).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem('nicoflow-rail') ?? '{}').closedAreaIds).toEqual(['area-1'])
    );
  });

  it('opens areas that have no stored entry', async () => {
    expandedStorage(['other-area']);
    withTree([workArea()]);

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.getByTestId('rail-area-area-1')).toHaveAttribute('aria-expanded', 'true'));
  });

  it('marks the open project active and mutes the Areas destination', async () => {
    withTree([workArea()]);
    renderComponent(<Rail />, { initialRoute: '/projects/p1' });

    await waitFor(() => expect(screen.getByTestId('rail-project-p1')).toHaveAttribute('aria-current', 'page'));
    // Areas keeps its prefix match — only the styling steps back — so the
    // section still reads as current for assistive tech.
    expect(screen.getByTestId('rail-areas')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('rail-areas')).not.toHaveClass('bg-primary/10');
  });

  it('does not mark a sibling project active', async () => {
    withTree([
      workArea([
        makeProject({ id: 'p1', name: 'Launch', areaId: 'area-1' }),
        makeProject({ id: 'p2', name: 'Other', areaId: 'area-1' }),
      ]),
    ]);

    renderComponent(<Rail />, { initialRoute: '/projects/p1' });

    await waitFor(() => expect(screen.getByTestId('rail-project-p2')).toBeInTheDocument());
    expect(screen.getByTestId('rail-project-p2')).not.toHaveAttribute('aria-current');
  });
});
