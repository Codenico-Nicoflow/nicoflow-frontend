import type { ApiEnvelope, ISubtask } from '@nicoflow/shared/types';
import { SUBTASK_API } from '@nicoflow/shared/types';
import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateSubtaskRequest,
  CreateSubtaskResponse,
  DeleteSubtaskRequest,
  DeleteSubtaskResponse,
  GetSubtasksRequest,
  GetSubtasksResponse,
  UpdateSubtaskRequest,
  UpdateSubtaskResponse,
} from './type';

export const subtaskApi = createApi({
  reducerPath: 'subtaskApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Subtask'],
  endpoints: builder => ({
    getSubtasks: builder.query<GetSubtasksResponse, GetSubtasksRequest>({
      query: taskId => SUBTASK_API.subtasks(taskId),
      // List endpoints wrap the array as { items } inside the data envelope.
      transformResponse: (raw: ApiEnvelope<{ items: ISubtask[] }>) => raw.data.items,
      transformErrorResponse: error => error.data,
      providesTags: (_result, _error, taskId) => [{ type: 'Subtask', id: taskId }],
    }),
    createSubtask: builder.mutation<CreateSubtaskResponse, CreateSubtaskRequest>({
      query: ({ taskId, ...body }) => ({
        url: SUBTASK_API.subtasks(taskId),
        method: 'POST',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<CreateSubtaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: (_result, _error, { taskId }) => [{ type: 'Subtask', id: taskId }],
    }),
    updateSubtask: builder.mutation<UpdateSubtaskResponse, UpdateSubtaskRequest>({
      query: ({ taskId, id, ...body }) => ({
        url: SUBTASK_API.subtask(taskId, id),
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<UpdateSubtaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: (_result, _error, { taskId }) => [{ type: 'Subtask', id: taskId }],
    }),
    deleteSubtask: builder.mutation<DeleteSubtaskResponse, DeleteSubtaskRequest>({
      query: ({ taskId, id }) => ({
        url: SUBTASK_API.subtask(taskId, id),
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: (_result, _error, { taskId }) => [{ type: 'Subtask', id: taskId }],
    }),
  }),
});

export const { useGetSubtasksQuery, useCreateSubtaskMutation, useUpdateSubtaskMutation, useDeleteSubtaskMutation } =
  subtaskApi;
