import { server } from '__tests__/server';
import type { IProject } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createAreaApi } from './area';
import type { AreaWithProjects } from './area.types';
import { createProjectApi } from './project';

const baseQuery = fetchBaseQuery({ baseUrl: 'http://localhost:8080/v1' });

const project = (id: string, displayOrder: number): IProject => ({
  id,
  areaId: 'A',
  name: id,
  status: 'active',
  folderIcon: 'folder',
  isFavorite: false,
  displayOrder,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

const seedBoard = (): AreaWithProjects[] => [
  {
    id: 'A',
    name: 'Area A',
    color: '#3B82F6',
    icon: 'folder',
    displayOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    projects: [project('p1', 0), project('p2', 1), project('p3', 2)],
  },
];

const makeStore = () => {
  const areaApi = createAreaApi(baseQuery);
  const projectApi = createProjectApi(baseQuery, areaApi);
  const store = configureStore({
    reducer: {
      auth: (state = { token: null }) => state,
      [areaApi.reducerPath]: areaApi.reducer,
      [projectApi.reducerPath]: projectApi.reducer,
    },
    middleware: gDM => gDM().concat(areaApi.middleware, projectApi.middleware),
  });
  return { store, areaApi, projectApi };
};

const currentOrder = (store: ReturnType<typeof makeStore>['store'], areaApi: ReturnType<typeof createAreaApi>) => {
  const state = areaApi.endpoints.getAreasWithProjects.select()(store.getState());
  return state.data?.[0]?.projects.map(p => p.id) ?? [];
};

describe('reorderProjects — optimistic cache update', () => {
  it('applies the new order immediately and keeps it on success', async () => {
    server.use(
      http.get('http://localhost:8080/v1/areas/with-projects', () =>
        HttpResponse.json({ data: seedBoard(), error: null })
      ),
      http.patch('http://localhost:8080/v1/projects/reorder', () =>
        HttpResponse.json({ data: { updated: 3 }, error: null })
      )
    );

    const { store, areaApi, projectApi } = makeStore();
    await store.dispatch(areaApi.endpoints.getAreasWithProjects.initiate());
    expect(currentOrder(store, areaApi)).toEqual(['p1', 'p2', 'p3']);

    const promise = store.dispatch(
      projectApi.endpoints.reorderProjects.initiate({
        items: [
          { id: 'p3', displayOrder: 0 },
          { id: 'p1', displayOrder: 1 },
          { id: 'p2', displayOrder: 2 },
        ],
      })
    );

    expect(currentOrder(store, areaApi)).toEqual(['p3', 'p1', 'p2']);

    await promise;
    expect(currentOrder(store, areaApi)).toEqual(['p3', 'p1', 'p2']);
  });

  it('rolls back the optimistic order when the request fails', async () => {
    server.use(
      http.get('http://localhost:8080/v1/areas/with-projects', () =>
        HttpResponse.json({ data: seedBoard(), error: null })
      ),
      http.patch('http://localhost:8080/v1/projects/reorder', () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom' } }, { status: 500 })
      )
    );

    const { store, areaApi, projectApi } = makeStore();
    await store.dispatch(areaApi.endpoints.getAreasWithProjects.initiate());

    const promise = store.dispatch(
      projectApi.endpoints.reorderProjects.initiate({
        items: [
          { id: 'p3', displayOrder: 0 },
          { id: 'p1', displayOrder: 1 },
          { id: 'p2', displayOrder: 2 },
        ],
      })
    );

    expect(currentOrder(store, areaApi)).toEqual(['p3', 'p1', 'p2']);

    await promise;
    expect(currentOrder(store, areaApi)).toEqual(['p1', 'p2', 'p3']);
  });
});
