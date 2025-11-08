import { createApi } from '@reduxjs/toolkit/query/react';

import { PROJECT_API } from '@my-monorepo/types';

import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectRequest,
  GetProjectRequest,
  GetProjectResponse,
  GetProjectsResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
} from './type';

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Project', 'Category'],
  endpoints: builder => ({
    getProjects: builder.query<GetProjectsResponse, void>({
      query: () => PROJECT_API.GET_PROJECTS,
      transformErrorResponse: error => error.data,
      providesTags: ['Project'],
    }),
    getProject: builder.query<GetProjectResponse, GetProjectRequest>({
      query: id => {
        return `${PROJECT_API.GET_PROJECT}${id}`;
      },
      transformErrorResponse: error => error.data,
      providesTags: ['Project'],
    }),
    createProject: builder.mutation<CreateProjectResponse, CreateProjectRequest>({
      query: body => ({
        url: PROJECT_API.CREATE_PROJECT,
        method: 'POST',
        body,
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<UpdateProjectResponse, { id: number; body: UpdateProjectRequest }>({
      query: ({ id, body }) => ({
        url: `${PROJECT_API.UPDATE_PROJECT}${id}`,
        method: 'PATCH',
        body,
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Project'],
    }),
    deleteProject: builder.mutation<void, DeleteProjectRequest>({
      query: id => ({
        url: `${PROJECT_API.DELETE_PROJECT}${id}`,
        method: 'DELETE',
      }),
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
} = projectApi;
