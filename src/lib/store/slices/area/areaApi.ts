import { createApi } from '@reduxjs/toolkit/query/react';

import { AREA_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateAreaRequest,
  CreateAreaResponse,
  DeleteAreaResponse,
  GetAllAreasResponse,
  GetAreaRequest,
  GetAreaResponse,
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
      transformErrorResponse: error => error.data,
      providesTags: ['Area'],
    }),
    getAreasWithProjects: builder.query<GetAllAreasResponse, void>({
      query: () => AREA_API.GET_AREAS_WITH_PROJECTS,
      transformErrorResponse: error => error.data,
      providesTags: ['Area'],
    }),
    getArea: builder.query<GetAreaResponse, GetAreaRequest>({
      query: id => `${AREA_API.GET_AREA}${id}`,
      transformErrorResponse: error => error.data,
    }),
    createArea: builder.mutation<CreateAreaResponse, CreateAreaRequest>({
      query: body => ({
        url: AREA_API.CREATE_AREA,
        method: 'POST',
        body,
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Area'],
    }),
    updateArea: builder.mutation<UpdateAreaResponse, UpdateAreaRequest>({
      query: ({ id, ...body }) => ({
        url: `${AREA_API.UPDATE_AREA}${id}`,
        method: 'PATCH',
        body,
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Area'],
    }),
    deleteArea: builder.mutation<DeleteAreaResponse, number>({
      query: id => ({
        url: `${AREA_API.DELETE_AREA}${id}`,
        method: 'DELETE',
      }),
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
} = areaApi;
