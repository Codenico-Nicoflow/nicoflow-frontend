import type { ApiEnvelope, IRecurrenceRule } from '@nicoflow/shared/types';
import { RECURRENCE_API } from '@nicoflow/shared/types';
import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateRecurrenceRuleRequest,
  ListRecurrenceRulesRequest,
  ListRecurrenceRulesResponse,
  PauseRecurrenceRuleRequest,
  RecurrenceStatsResponse,
  UpdateRecurrenceRuleRequest,
} from './type';

// Recurrence rule data layer (E-050). Every mutation also changes the task rows
// the rule owns — creating a rule materializes instance #1, editing re-stamps the
// live instance, deleting reaps the pending one — so each invalidates 'Task' as
// well as its own tag. 'RecurrenceStats' is separate because stats are derived
// from occurrence rows and move when a task is completed, not only when the rule
// itself changes.
export const recurrenceApi = createApi({
  reducerPath: 'recurrenceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['RecurrenceRule', 'RecurrenceStats'],
  endpoints: builder => ({
    getRecurrenceRules: builder.query<ListRecurrenceRulesResponse, ListRecurrenceRulesRequest>({
      query: ({ projectId } = {}) => {
        const qs = projectId ? `?${new URLSearchParams({ projectId }).toString()}` : '';
        return `${RECURRENCE_API.LIST}${qs}`;
      },
      transformResponse: (raw: ApiEnvelope<ListRecurrenceRulesResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: result =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'RecurrenceRule' as const, id })),
              { type: 'RecurrenceRule' as const, id: 'LIST' },
            ]
          : [{ type: 'RecurrenceRule' as const, id: 'LIST' }],
    }),

    getRecurrenceRule: builder.query<IRecurrenceRule, string>({
      query: id => `${RECURRENCE_API.DETAIL}${id}`,
      transformResponse: (raw: ApiEnvelope<IRecurrenceRule>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: (_result, _error, id) => [{ type: 'RecurrenceRule', id }],
    }),

    getRecurrenceStats: builder.query<RecurrenceStatsResponse, string>({
      query: id => `${RECURRENCE_API.STATS}${id}/stats`,
      transformResponse: (raw: ApiEnvelope<RecurrenceStatsResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: (_result, _error, id) => [{ type: 'RecurrenceStats', id }],
    }),

    createRecurrenceRule: builder.mutation<IRecurrenceRule, CreateRecurrenceRuleRequest>({
      query: ({ projectId, ...body }) => ({
        url: `${RECURRENCE_API.CREATE}${projectId}/recurrence-rules`,
        method: 'POST',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<IRecurrenceRule>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: [{ type: 'RecurrenceRule', id: 'LIST' }],
    }),

    updateRecurrenceRule: builder.mutation<IRecurrenceRule, UpdateRecurrenceRuleRequest>({
      query: ({ id, ...body }) => ({
        url: `${RECURRENCE_API.DETAIL}${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<IRecurrenceRule>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'RecurrenceRule', id },
        { type: 'RecurrenceRule', id: 'LIST' },
      ],
    }),

    pauseRecurrenceRule: builder.mutation<IRecurrenceRule, PauseRecurrenceRuleRequest>({
      query: ({ id, paused }) => ({
        url: `${RECURRENCE_API.PAUSE}${id}/pause`,
        method: 'PATCH',
        body: { paused },
      }),
      transformResponse: (raw: ApiEnvelope<IRecurrenceRule>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'RecurrenceRule', id },
        { type: 'RecurrenceRule', id: 'LIST' },
      ],
    }),

    deleteRecurrenceRule: builder.mutation<void, string>({
      query: id => ({
        url: `${RECURRENCE_API.DETAIL}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: (_result, _error, id) => [
        { type: 'RecurrenceRule', id },
        { type: 'RecurrenceRule', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetRecurrenceRulesQuery,
  useGetRecurrenceRuleQuery,
  useGetRecurrenceStatsQuery,
  useCreateRecurrenceRuleMutation,
  useUpdateRecurrenceRuleMutation,
  usePauseRecurrenceRuleMutation,
  useDeleteRecurrenceRuleMutation,
} = recurrenceApi;
