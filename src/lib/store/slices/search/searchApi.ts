import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope } from '@/lib/types';
import { SEARCH_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type { ISearchResults } from './type';

export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Search'],
  // Search results are read-only; keep them 30 s to avoid re-firing on rapid
  // navigation back to a recently-typed query.
  keepUnusedDataFor: 30,
  endpoints: builder => ({
    search: builder.query<ISearchResults, string>({
      query: q => ({
        url: SEARCH_API.SEARCH,
        params: { q: encodeURIComponent(q), types: 'task,project,area', limit: 10 },
      }),
      transformResponse: (raw: ApiEnvelope<ISearchResults>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['Search'],
    }),
  }),
});

export const { useSearchQuery } = searchApi;
