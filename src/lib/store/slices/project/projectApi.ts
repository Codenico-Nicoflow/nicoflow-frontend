import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope } from '@/lib/types';
import { PROJECT_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

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
} from './type';

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: baseQueryWithReauth,
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
      invalidatesTags: ['Project'],
    }),
    deleteProject: builder.mutation<DeleteProjectResponse, DeleteProjectRequest>({
      query: id => ({
        url: `${PROJECT_API.DELETE_PROJECT}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
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
      invalidatesTags: ['Project'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectMutation,
  useReorderProjectsMutation,
} = projectApi;
