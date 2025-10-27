import { createApi } from '@reduxjs/toolkit/query/react';

import { TASKS_API } from '../../api/endpoints';
import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  DeleteTaskResponse,
  GetTaskRequest,
  GetTaskResponse,
  GetTasksResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
} from './type';

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Task'],
  endpoints: builder => ({
    getTasks: builder.query<GetTasksResponse, void>({
      query: () => TASKS_API.GET_TASKS,
      transformErrorResponse: error => error.data,
      providesTags: ['Task'],
    }),
    getTask: builder.query<GetTaskResponse, GetTaskRequest>({
      query: id => `${TASKS_API.GET_TASK}${id}`,
      transformErrorResponse: error => error.data,
      providesTags: ['Task'],
    }),
    createTask: builder.mutation<CreateTaskResponse, CreateTaskRequest>({
      query: body => ({
        url: TASKS_API.CREATE_TASK,
        method: 'POST',
        body,
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation<UpdateTaskResponse, UpdateTaskRequest>({
      query: ({ id, ...body }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}`,
        method: 'PATCH',
        body,
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation<DeleteTaskResponse, void>({
      query: id => ({
        url: `${TASKS_API.DELETE_TASK}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Task'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
