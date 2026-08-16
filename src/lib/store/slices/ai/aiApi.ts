import type { ApiEnvelope } from '@nicoflow/shared/types';
import { AI_API } from '@nicoflow/shared/types';
import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateAISessionRequest,
  CreateAISessionResponse,
  GetAISessionResponse,
  GetAISessionsResponse,
  GetAIUsageResponse,
  GetSessionMessagesPage,
  GetSessionMessagesRequest,
  ListPendingToolCallsResponse,
} from './type';

// AI-assistant data layer: sessions CRUD + usage. Every endpoint unwraps the
// { data, error } envelope via transformResponse. Sessions are tagged 'AISession'
// (a LIST tag + a per-id tag) so a create/delete refetches the list and a detail
// read is scoped to its own id. Streaming send-message is NOT here — it is an
// SSE-over-POST call the chat story owns, outside RTK Query's request model.
export const aiApi = createApi({
  reducerPath: 'aiApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AISession'],
  endpoints: builder => ({
    getAISessions: builder.query<GetAISessionsResponse, void>({
      query: () => AI_API.SESSIONS,
      transformResponse: (raw: ApiEnvelope<GetAISessionsResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: result =>
        result
          ? [...result.map(({ id }) => ({ type: 'AISession' as const, id })), { type: 'AISession', id: 'LIST' }]
          : [{ type: 'AISession', id: 'LIST' }],
    }),
    getAISession: builder.query<GetAISessionResponse, string>({
      query: id => `${AI_API.SESSION}${id}`,
      transformResponse: (raw: ApiEnvelope<GetAISessionResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: (_result, _error, id) => [{ type: 'AISession', id }],
    }),
    createAISession: builder.mutation<CreateAISessionResponse, CreateAISessionRequest>({
      query: body => ({
        url: AI_API.SESSIONS,
        method: 'POST',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<CreateAISessionResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: [{ type: 'AISession', id: 'LIST' }],
    }),
    deleteAISession: builder.mutation<void, string>({
      query: id => ({
        url: `${AI_API.SESSION}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: (_result, _error, id) => [
        { type: 'AISession', id },
        { type: 'AISession', id: 'LIST' },
      ],
    }),
    // Quota state. Deliberately no pollingInterval — usage refetches on tag
    // invalidation after a send, not on a timer.
    getAIUsage: builder.query<GetAIUsageResponse, void>({
      query: () => AI_API.USAGE,
      transformResponse: (raw: ApiEnvelope<GetAIUsageResponse>) => raw.data,
      transformErrorResponse: error => error.data,
    }),
    // Pending tool proposals for a session — used to rehydrate the chat after a
    // reload so unresolved proposals still appear. Tagged by session id so the
    // list refetches whenever the session cache is invalidated.
    listPendingToolCalls: builder.query<ListPendingToolCallsResponse, string>({
      query: sessionId => `${AI_API.TOOL_CALLS(sessionId)}?status=pending`,
      transformResponse: (raw: ApiEnvelope<ListPendingToolCallsResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: (_result, _error, sessionId) => [{ type: 'AISession', id: sessionId }],
    }),

    // Older chat history (GET /ai/sessions/:id/messages). Items come back ASC
    // (oldest→newest) and nextCursor points to the OLDER batch — so this uses
    // getPreviousPageParam. The first fetch is seeded from the session detail's
    // messagesCursor field (passed as seedCursor in the query arg, then set as
    // initialPageParam at the call site via useInfiniteQueryOptions).
    getSessionMessages: builder.infiniteQuery<GetSessionMessagesPage, GetSessionMessagesRequest, string>({
      infiniteQueryOptions: {
        // Static default; overridden per-session at the hook call site via
        // { initialPageParam: seedCursor } in UseInfiniteQueryOptions.
        initialPageParam: '',
        // RTK requires getNextPageParam even when only loading in the "previous"
        // direction. Return undefined so hasNextPage is always false.
        getNextPageParam: () => undefined,
        // Only "load older" is supported via fetchPreviousPage.
        getPreviousPageParam: (firstPage: GetSessionMessagesPage) =>
          firstPage.nextCursor === '' ? undefined : firstPage.nextCursor,
      },
      query: ({ queryArg, pageParam }) => ({
        url: AI_API.MESSAGES(queryArg.sessionId),
        params: {
          ...(pageParam !== '' && { cursor: pageParam }),
          limit: 50,
        },
      }),
      transformResponse: (raw: ApiEnvelope<GetSessionMessagesPage>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: (_result, _error, { sessionId }) => [{ type: 'AISession', id: sessionId }],
    }),
  }),
});

export const {
  useGetAISessionsQuery,
  useGetAISessionQuery,
  useCreateAISessionMutation,
  useDeleteAISessionMutation,
  useGetAIUsageQuery,
  useListPendingToolCallsQuery,
  useGetSessionMessagesInfiniteQuery,
} = aiApi;
