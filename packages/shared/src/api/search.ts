import type { ApiEnvelope } from '@nicoflow/shared/types';
import { SEARCH_API } from '@nicoflow/shared/types';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiBaseQuery } from './area';
import type { ISearchResults } from './search.types';

export const createSearchApi = (baseQuery: ApiBaseQuery) => {
  const searchApi = createApi({
    reducerPath: 'searchApi',
    baseQuery,
    tagTypes: ['Search'],
    // Search results are read-only; keep them 30 s to avoid re-firing on rapid
    // navigation back to a recently-typed query.
    keepUnusedDataFor: 30,
    endpoints: builder => ({
      search: builder.query<ISearchResults, string>({
        query: q => ({
          url: SEARCH_API.SEARCH,
          // Pass q raw — RTK Query URL-encodes params; encoding here too double-encodes
          // (a space would become %2520, not %20).
          params: { q, types: 'task,project,area', limit: 10 },
        }),
        transformResponse: (raw: ApiEnvelope<ISearchResults>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: ['Search'],
      }),
    }),
  });

  return searchApi;
};
