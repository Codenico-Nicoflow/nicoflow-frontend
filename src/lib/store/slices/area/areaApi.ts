import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope } from '@/lib/types';
import { AREA_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

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
} from './type';

export const areaApi = createApi({
  reducerPath: 'areaApi',
  baseQuery: baseQueryWithReauth,
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
      invalidatesTags: ['Area'],
    }),
  }),
});

export const {
  useGetAreasQuery,
  useGetAreasWithProjectsQuery,
  useGetAreaQuery,
  useCreateAreaMutation,
  useDeleteAreaMutation,
  useUpdateAreaMutation,
  useReorderAreasMutation,
} = areaApi;
