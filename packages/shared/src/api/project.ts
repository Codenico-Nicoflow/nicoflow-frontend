import type { ApiEnvelope } from '@nicoflow/shared/types';
import { PROJECT_API } from '@nicoflow/shared/types';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiBaseQuery, createAreaApi } from './area';
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectRequest,
  DeleteProjectResponse,
  GetProjectRequest,
  GetProjectResponse,
  GetProjectsResponse,
  ReorderProjectsRequest,
  ReorderProjectsResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
} from './project.types';

// Tags don't cross createApi instances — the constructed areaApi is injected
// (built by the consuming app in the same call chain as this factory) so its
// board cache can be invalidated/patched directly.
export type AreaApi = ReturnType<typeof createAreaApi>;

export const createProjectApi = (baseQuery: ApiBaseQuery, areaApi: AreaApi) => {
  const refreshBoardOnSuccess = async (
    _arg: unknown,
    { dispatch, queryFulfilled }: { dispatch: Dispatch<UnknownAction>; queryFulfilled: Promise<unknown> }
  ) => {
    try {
      await queryFulfilled;
      dispatch(areaApi.util.invalidateTags(['Area']));
    } catch {
      // mutation failed (e.g. plan limit / 5xx) — nothing to refresh.
    }
  };

  const projectApi = createApi({
    reducerPath: 'projectApi',
    baseQuery,
    tagTypes: ['Project', 'Area'],
    endpoints: builder => ({
      getProjects: builder.query<GetProjectsResponse, void>({
        query: () => PROJECT_API.GET_PROJECTS,
        transformResponse: (raw: ApiEnvelope<GetProjectsResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: ['Project'],
      }),
      getProject: builder.query<GetProjectResponse, GetProjectRequest>({
        query: id => `${PROJECT_API.GET_PROJECT}${id}`,
        transformResponse: (raw: ApiEnvelope<GetProjectResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: ['Project'],
      }),
      createProject: builder.mutation<CreateProjectResponse, CreateProjectRequest>({
        query: ({ areaId, ...body }) => ({
          url: `${PROJECT_API.CREATE_PROJECT_IN_AREA}${areaId}/projects`,
          method: 'POST',
          body,
        }),
        transformResponse: (raw: ApiEnvelope<CreateProjectResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        onQueryStarted: refreshBoardOnSuccess,
        invalidatesTags: ['Project'],
      }),
      updateProject: builder.mutation<UpdateProjectResponse, UpdateProjectRequest>({
        query: ({ id, ...body }) => ({
          url: `${PROJECT_API.UPDATE_PROJECT}${id}`,
          method: 'PATCH',
          body,
        }),
        transformResponse: (raw: ApiEnvelope<UpdateProjectResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        onQueryStarted: refreshBoardOnSuccess,
        invalidatesTags: ['Project'],
      }),
      deleteProject: builder.mutation<DeleteProjectResponse, DeleteProjectRequest>({
        query: id => ({
          url: `${PROJECT_API.DELETE_PROJECT}${id}`,
          method: 'DELETE',
        }),
        transformErrorResponse: error => error.data,
        onQueryStarted: refreshBoardOnSuccess,
        invalidatesTags: ['Project'],
      }),
      reorderProjects: builder.mutation<ReorderProjectsResponse, ReorderProjectsRequest>({
        query: body => ({
          url: PROJECT_API.REORDER_PROJECTS,
          method: 'PATCH',
          body,
        }),
        transformResponse: (raw: ApiEnvelope<ReorderProjectsResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        // Optimistically apply the new displayOrder to the board cache so the
        // reorder feels instant; roll back if the request fails.
        onQueryStarted: async ({ items }, { dispatch, queryFulfilled }) => {
          const orderById = new Map(items.map(i => [i.id, i.displayOrder]));
          const patch = dispatch(
            areaApi.util.updateQueryData('getAreasWithProjects', undefined, draft => {
              for (const area of draft) {
                if (!area.projects?.some(p => orderById.has(p.id))) continue;
                for (const project of area.projects) {
                  const next = orderById.get(project.id);
                  if (next !== undefined) project.displayOrder = next;
                }
                area.projects.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
              }
            })
          );
          try {
            await queryFulfilled;
          } catch {
            patch.undo();
          }
        },
        invalidatesTags: ['Project', 'Area'],
      }),
    }),
  });

  return projectApi;
};
