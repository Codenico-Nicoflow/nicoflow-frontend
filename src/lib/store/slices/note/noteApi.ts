import type { FetchBaseQueryError, InfiniteData } from '@reduxjs/toolkit/query';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope, ApiErrorBody, INoteDetail } from '@/lib/types';
import { NOTE_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type { CreateNoteRequest, ListNotesPage, ListNotesRequest, UpdateNoteRequest } from './type';

// Derived from the RTK utils themselves rather than importing RootState — see
// taskApi.ts's identical types for why.
type NoteApiState = Parameters<typeof noteApi.util.selectInvalidatedBy>[0];
type NoteListPatch = ReturnType<typeof noteApi.util.updateQueryData>;
type NoteApiDispatch = <T extends NoteListPatch>(patch: T) => ReturnType<T>;

/**
 * Truncate every cached `getNotes` page list back to just page 1.
 *
 * A create/edit/delete shifts the keyset (updated_at DESC) — create adds a
 * row, delete removes one, and an edit re-tops the note. Called from
 * `onQueryStarted` BEFORE the request resolves, so only page 1 remains by
 * the time `invalidatesTags`' own refetch runs — see taskApi.ts's
 * `collapseTaskListsToPage1` for the full race-condition explanation.
 */
const collapseNoteListsToPage1 = (state: NoteApiState, dispatch: NoteApiDispatch) =>
  noteApi.util
    .selectInvalidatedBy(state, [{ type: 'Note', id: 'LIST' }])
    .filter(entry => entry.endpointName === 'getNotes')
    .forEach(entry =>
      dispatch(
        noteApi.util.updateQueryData(
          'getNotes',
          entry.originalArgs as ListNotesRequest,
          (draft: InfiniteData<ListNotesPage, string>) => {
            draft.pages = draft.pages.slice(0, 1);
            draft.pageParams = draft.pageParams.slice(0, 1);
          }
        )
      )
    );

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
    // Cursor-paginated note list (keyset on (updated_at, id) DESC).
    // Three generics: page shape, query arg (cache key), page param type.
    getNotes: builder.infiniteQuery<ListNotesPage, ListNotesRequest, string>({
      infiniteQueryOptions: {
        initialPageParam: '',
        getNextPageParam: (lastPage: ListNotesPage) => (lastPage.nextCursor === '' ? undefined : lastPage.nextCursor),
      },
      query: ({ queryArg, pageParam }) => {
        const params = new URLSearchParams({ projectId: queryArg.projectId });
        if (pageParam !== '') params.set('cursor', pageParam);
        params.set('limit', '50');
        return `${NOTE_API.LIST}?${params.toString()}`;
      },
      transformResponse: (raw: ApiEnvelope<ListNotesPage>) => raw.data,
      transformErrorResponse: toApiError,
      providesTags: result =>
        result
          ? [
              ...result.pages.flatMap(page => page.items.map(({ id }) => ({ type: 'Note' as const, id }))),
              { type: 'Note' as const, id: 'LIST' },
            ]
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
      // Collapse before the request resolves — see collapseNoteListsToPage1.
      onQueryStarted: (_arg, { dispatch, getState }) => {
        collapseNoteListsToPage1(getState(), dispatch);
      },
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
      // Collapse before the request resolves — an edit re-tops the note (the
      // list keys on updated_at DESC), same page-boundary shift as create.
      onQueryStarted: (_arg, { dispatch, getState }) => {
        collapseNoteListsToPage1(getState(), dispatch);
      },
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
      onQueryStarted: (_arg, { dispatch, getState }) => {
        collapseNoteListsToPage1(getState(), dispatch);
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Note', id },
        { type: 'Note', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetNotesInfiniteQuery,
  useGetNoteQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = noteApi;
