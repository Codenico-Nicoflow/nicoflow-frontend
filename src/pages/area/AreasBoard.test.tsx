import { renderComponent } from '__tests__/renderComponent';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeProject, mockAreaWithProjects } from '@/mocks/handlers';

import { server } from '../../../__tests__/server';

import AreasBoard from './AreasBoard';

const WITH_PROJECTS = 'http://localhost:8080/v1/areas/with-projects';
const envelope = <T,>(data: T) => ({ data, error: null });

const seedAreas = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    ...mockAreaWithProjects,
    id: `area-${i}`,
    name: `Area ${i}`,
    projects: [],
  }));

describe('AreasBoard', () => {
  it('shows the empty state with a create action when there are no areas', async () => {
    renderComponent(<AreasBoard />, { initialRoute: '/areas' });

    expect(await screen.findByTestId('board-empty')).toBeInTheDocument();
    expect(screen.getByTestId('board-empty-create')).toBeInTheDocument();
  });

  it('renders a card per area with its projects', async () => {
    server.use(http.get(WITH_PROJECTS, () => HttpResponse.json(envelope([mockAreaWithProjects]))));

    renderComponent(<AreasBoard />, { initialRoute: '/areas' });

    expect(await screen.findByTestId('areas-grid')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Redesign')).toBeInTheDocument();
  });

  it('gates a free user at the area limit with an inline alert and disabled button', async () => {
    server.use(http.get(WITH_PROJECTS, () => HttpResponse.json(envelope(seedAreas(3)))));

    renderComponent(<AreasBoard />, { initialRoute: '/areas' });

    await screen.findByTestId('areas-grid');
    await waitFor(() => expect(screen.getByTestId('plan-limit-alert')).toBeInTheDocument());
    expect(screen.getByTestId('board-new-area')).toBeDisabled();
  });

  it('gates a free user at the 5-project limit, disabling New Project (R4)', async () => {
    // 2 areas holding 5 projects total — at the free project limit, below the area limit.
    const areas = [
      {
        ...mockAreaWithProjects,
        id: 'a0',
        name: 'Area 0',
        projects: [makeProject({ id: 'p0' }), makeProject({ id: 'p1' }), makeProject({ id: 'p2' })],
      },
      {
        ...mockAreaWithProjects,
        id: 'a1',
        name: 'Area 1',
        projects: [makeProject({ id: 'p3' }), makeProject({ id: 'p4' })],
      },
    ];
    server.use(http.get(WITH_PROJECTS, () => HttpResponse.json(envelope(areas))));

    renderComponent(<AreasBoard />, { initialRoute: '/areas' });

    await screen.findByTestId('areas-grid');
    await waitFor(() => expect(screen.getByTestId('plan-limit-alert')).toBeInTheDocument());
    expect(screen.getByTestId('board-new-project')).toBeDisabled();
    // The area button must stay enabled — only 2 of 3 areas used.
    expect(screen.getByTestId('board-new-area')).not.toBeDisabled();
  });
});
