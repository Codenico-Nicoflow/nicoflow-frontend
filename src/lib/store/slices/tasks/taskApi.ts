import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope } from '@/lib/types';
import { TASKS_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  DeleteTaskRequest,
  DeleteTaskResponse,
  GetTaskRequest,
  GetTaskResponse,
  GetTasksResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
  UpdateTaskStatusRequest,
  UpdateTaskStatusResponse,
} from './type';

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Task'],
  endpoints: builder => ({
    getTasks: builder.query<GetTasksResponse, void>({
      query: () => TASKS_API.GET_TASKS,
      transformResponse: (raw: ApiEnvelope<GetTasksResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['Task'],
    }),
    getTask: builder.query<GetTaskResponse, GetTaskRequest>({
      query: id => `${TASKS_API.GET_TASK}${id}`,
      transformResponse: (raw: ApiEnvelope<GetTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['Task'],
    }),
    createTask: builder.mutation<CreateTaskResponse, CreateTaskRequest>({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/tasks`,
        method: 'POST',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<CreateTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation<UpdateTaskResponse, UpdateTaskRequest>({
      query: ({ id, ...body }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<UpdateTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation<DeleteTaskResponse, DeleteTaskRequest>({
      query: id => ({
        url: `${TASKS_API.DELETE_TASK}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Task'],
    }),
    updateTaskStatus: builder.mutation<UpdateTaskStatusResponse, UpdateTaskStatusRequest>({
      query: ({ id, status }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (raw: ApiEnvelope<UpdateTaskStatusResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      // Optimistic: flip the status in the cached list immediately; undo on failure.
      onQueryStarted: async ({ id, status }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          taskApi.util.updateQueryData('getTasks', undefined, draft => {
            const found = draft.find(task => task.id === id);
            if (found) found.status = status;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
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
  useUpdateTaskStatusMutation,
} = taskApi;
