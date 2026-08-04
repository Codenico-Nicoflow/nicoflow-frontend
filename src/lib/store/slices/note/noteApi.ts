import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope, ApiErrorBody, INote, INoteDetail } from '@/lib/types';
import { NOTE_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type { CreateNoteRequest, ListNotesRequest, UpdateNoteRequest } from './type';

// The raw RTK Query error is { status, data: <full envelope> }, so the API code
// sits at error.data.error.code — one level deeper than the bare `error.data`
// most slices forward. Notes need it unwrapped because a 409 is a control-flow
// signal, not just something to toast: useNoteAutosave (NIC-1917) has to tell
// CONFLICT from every other failure to know when to stop saving. Reading one
// level too shallow yields undefined and the autosave loop never halts.
const toApiError = (error: FetchBaseQueryError): ApiErrorBody | undefined => {
  const envelope = error.data;
  if (envelope && typeof envelope === 'object' && 'error' in envelope) {
    const body = (envelope as ApiEnvelope<unknown>).error;
    if (body) return body;
  }
  return undefined;
};

// Project notes data layer (E-053). Two view shapes share one 'Note' tag: the
// list rows and the scalar detail are the same resource, so a save has to
// refresh both — the row's excerpt and updatedAt move with the body. Scalar
// reads are tagged by id so editing one note doesn't refetch every open note.
//
// Notes are FREE and unlimited: nothing here handles PLAN_LIMIT_EXCEEDED.
export const noteApi = createApi({
  reducerPath: 'noteApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Note'],
  endpoints: builder => ({
    getNotes: builder.query<INote[], ListNotesRequest>({
      query: ({ projectId }) => `${NOTE_API.LIST}?${new URLSearchParams({ projectId }).toString()}`,
      transformResponse: (raw: ApiEnvelope<INote[]>) => raw.data,
      transformErrorResponse: toApiError,
      providesTags: result =>
        result
          ? [...result.map(({ id }) => ({ type: 'Note' as const, id })), { type: 'Note' as const, id: 'LIST' }]
          : [{ type: 'Note' as const, id: 'LIST' }],
    }),

    getNote: builder.query<INoteDetail, string>({
      query: id => `${NOTE_API.DETAIL}${id}`,
      transformResponse: (raw: ApiEnvelope<INoteDetail>) => raw.data,
      transformErrorResponse: toApiError,
      providesTags: (_result, _error, id) => [{ type: 'Note', id }],
    }),

    createNote: builder.mutation<INoteDetail, CreateNoteRequest>({
      query: body => ({
        url: NOTE_API.CREATE,
        method: 'POST',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<INoteDetail>) => raw.data,
      transformErrorResponse: toApiError,
      invalidatesTags: [{ type: 'Note', id: 'LIST' }],
    }),

    // A 409 here is a conflict state for the caller to surface, never something
    // to retry: the stored document has moved on and a blind retry would spin
    // against it forever. useNoteAutosave (NIC-1917) halts on this.
    updateNote: builder.mutation<INoteDetail, UpdateNoteRequest>({
      query: ({ id, ...body }) => ({
        url: `${NOTE_API.DETAIL}${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<INoteDetail>) => raw.data,
      transformErrorResponse: toApiError,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Note', id },
        { type: 'Note', id: 'LIST' },
      ],
    }),

    deleteNote: builder.mutation<void, string>({
      query: id => ({
        url: `${NOTE_API.DETAIL}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: toApiError,
      invalidatesTags: (_result, _error, id) => [
        { type: 'Note', id },
        { type: 'Note', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetNotesQuery,
  useGetNoteQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = noteApi;
