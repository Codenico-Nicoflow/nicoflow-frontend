import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope } from '@/lib/types';
import { TASKS_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  DeleteTaskRequest,
  DeleteTaskResponse,
  GetFocusRequest,
  GetFocusResponse,
  GetTaskRequest,
  GetTaskResponse,
  GetTasksRequest,
  GetTasksResponse,
  GetTimeSpreadResponse,
  ReorderTaskRequest,
  ReorderTaskResponse,
  ScheduleTaskRequest,
  ScheduleTaskResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
  UpdateTaskStatusRequest,
  UpdateTaskStatusResponse,
} from './type';

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: baseQueryWithReauth,
  // 'Task' = per-project lists. 'Focus' and 'TimeSpread' are derived cross-project
  // views (ranked list / day buckets): any task mutation must refresh them too.
  tagTypes: ['Task', 'Focus', 'TimeSpread'],
  endpoints: builder => ({
    getTasks: builder.query<GetTasksResponse, GetTasksRequest>({
      query: ({ projectId, ...params }) => ({
        url: `/projects/${projectId}/tasks`,
        params,
      }),
      // List endpoints wrap the array as { items } inside the data envelope.
      transformResponse: (raw: ApiEnvelope<{ items: GetTasksResponse }>) => raw.data.items,
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
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    updateTask: builder.mutation<UpdateTaskResponse, UpdateTaskRequest>({
      query: ({ id, ...body }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<UpdateTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    deleteTask: builder.mutation<DeleteTaskResponse, DeleteTaskRequest>({
      query: id => ({
        url: `${TASKS_API.DELETE_TASK}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    updateTaskStatus: builder.mutation<UpdateTaskStatusResponse, UpdateTaskStatusRequest>({
      query: ({ id, status }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (raw: ApiEnvelope<UpdateTaskStatusResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      // Optimistic: flip the status in every cached getTasks list immediately
      // (lists are keyed by project + filters), and undo all patches on failure.
      onQueryStarted: async ({ id, status }, { dispatch, getState, queryFulfilled }) => {
        const entries = taskApi.util.selectInvalidatedBy(getState(), [{ type: 'Task' }]);
        const patches = entries
          .filter(entry => entry.endpointName === 'getTasks')
          .map(entry =>
            dispatch(
              taskApi.util.updateQueryData('getTasks', entry.originalArgs as GetTasksRequest, draft => {
                const found = draft.find(task => task.id === id);
                if (found) found.status = status;
              })
            )
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    reorderTask: builder.mutation<ReorderTaskResponse, ReorderTaskRequest>({
      query: ({ id, displayOrder }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}/reorder`,
        method: 'PATCH',
        body: { displayOrder },
      }),
      transformResponse: (raw: ApiEnvelope<ReorderTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      // Optimistic: move the task to its target order in every cached getTasks
      // list and repack siblings contiguously (mirrors the backend); undo on failure.
      onQueryStarted: async ({ id, displayOrder }, { dispatch, getState, queryFulfilled }) => {
        const entries = taskApi.util.selectInvalidatedBy(getState(), [{ type: 'Task' }]);
        const patches = entries
          .filter(entry => entry.endpointName === 'getTasks')
          .map(entry =>
            dispatch(
              taskApi.util.updateQueryData('getTasks', entry.originalArgs as GetTasksRequest, draft => {
                const moved = draft.find(task => task.id === id);
                if (!moved) return;
                const siblings = draft.filter(task => task.id !== id).sort((a, b) => a.displayOrder - b.displayOrder);
                siblings.splice(Math.min(Math.max(displayOrder, 0), siblings.length), 0, moved);
                siblings.forEach((task, order) => {
                  task.displayOrder = order;
                });
              })
            )
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    scheduleTask: builder.mutation<ScheduleTaskResponse, ScheduleTaskRequest>({
      query: ({ id, ...body }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}/schedule`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<ScheduleTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    // Focus — "what can I do right now?" Ranked across all projects, so it lives
    // outside the per-project getTasks lists under its own Focus tag; any task
    // mutation invalidates Focus (see the mutation invalidatesTags above).
    getFocus: builder.query<GetFocusResponse, GetFocusRequest>({
      query: params => ({
        url: '/focus',
        params,
      }),
      transformResponse: (raw: ApiEnvelope<{ items: GetFocusResponse }>) => raw.data.items,
      transformErrorResponse: error => error.data,
      providesTags: ['Focus'],
    }),
    // Time Spread — the today/tomorrow/this-week buckets. Another derived
    // cross-project view under its own tag, refreshed by any task mutation.
    getTimeSpread: builder.query<GetTimeSpreadResponse, void>({
      query: () => '/time-spread',
      transformResponse: (raw: ApiEnvelope<GetTimeSpreadResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['TimeSpread'],
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
  useReorderTaskMutation,
  useScheduleTaskMutation,
  useGetFocusQuery,
  useGetTimeSpreadQuery,
} = taskApi;
