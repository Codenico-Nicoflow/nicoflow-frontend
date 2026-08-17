import type { ApiEnvelope } from '@nicoflow/shared/types';
import { AREA_API } from '@nicoflow/shared/types';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import { createApi } from '@reduxjs/toolkit/query/react';

import type {
  AreaWithProjects,
  CreateAreaRequest,
  CreateAreaResponse,
  DeleteAreaResponse,
  GetAllAreasResponse,
  GetAreaRequest,
  GetAreaResponse,
  GetAreasWithProjectsResponse,
  ReorderAreasRequest,
  ReorderAreasResponse,
  UpdateAreaRequest,
  UpdateAreaResponse,
} from './area.types';

// Matches the shape of the consuming app's fetchBaseQuery-based query fn
// (web's baseQueryWithReauth). The base query is injected rather than
// imported: it's built from platform-specific pieces (token storage,
// refresh-mutex, toast/redirect side effects) that stay in the consuming app
// until those seams are abstracted (NIC-1939).
export type ApiBaseQuery = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta>;

export const createAreaApi = (baseQuery: ApiBaseQuery) => {
  const areaApi = createApi({
    reducerPath: 'areaApi',
    baseQuery,
    tagTypes: ['Area'],
    endpoints: builder => ({
      getAreas: builder.query<GetAllAreasResponse, void>({
        query: () => AREA_API.GET_AREAS,
        transformResponse: (raw: ApiEnvelope<GetAllAreasResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: ['Area'],
      }),
      getAreasWithProjects: builder.query<GetAreasWithProjectsResponse, void>({
        query: () => AREA_API.GET_AREAS_WITH_PROJECTS,
        transformResponse: (raw: ApiEnvelope<AreaWithProjects[]>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: ['Area'],
      }),
      getArea: builder.query<GetAreaResponse, GetAreaRequest>({
        query: id => `${AREA_API.GET_AREA}${id}`,
        transformResponse: (raw: ApiEnvelope<GetAreaResponse>) => raw.data,
        transformErrorResponse: error => error.data,
      }),
      createArea: builder.mutation<CreateAreaResponse, CreateAreaRequest>({
        query: body => ({
          url: AREA_API.CREATE_AREA,
          method: 'POST',
          body,
        }),
        transformResponse: (raw: ApiEnvelope<CreateAreaResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        invalidatesTags: ['Area'],
      }),
      updateArea: builder.mutation<UpdateAreaResponse, UpdateAreaRequest>({
        query: ({ id, ...body }) => ({
          url: `${AREA_API.UPDATE_AREA}${id}`,
          method: 'PATCH',
          body,
        }),
        transformResponse: (raw: ApiEnvelope<UpdateAreaResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        invalidatesTags: ['Area'],
      }),
      deleteArea: builder.mutation<DeleteAreaResponse, string>({
        query: id => ({
          url: `${AREA_API.DELETE_AREA}${id}`,
          method: 'DELETE',
        }),
        transformErrorResponse: error => error.data,
        invalidatesTags: ['Area'],
      }),
      reorderAreas: builder.mutation<ReorderAreasResponse, ReorderAreasRequest>({
        query: body => ({
          url: AREA_API.REORDER_AREAS,
          method: 'PATCH',
          body,
        }),
        transformResponse: (raw: ApiEnvelope<ReorderAreasResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        // Optimistically reorder the board cache; roll back on failure.
        onQueryStarted: async ({ items }, { dispatch, queryFulfilled }) => {
          const orderById = new Map(items.map(i => [i.id, i.displayOrder]));
          const patch = dispatch(
            areaApi.util.updateQueryData('getAreasWithProjects', undefined, draft => {
              for (const area of draft) {
                const next = orderById.get(area.id);
                if (next !== undefined) area.displayOrder = next;
              }
              draft.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
            })
          );
          try {
            await queryFulfilled;
          } catch {
            patch.undo();
          }
        },
        invalidatesTags: ['Area'],
      }),
    }),
  });

  return areaApi;
};
