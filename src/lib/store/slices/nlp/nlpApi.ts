import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope } from '@/lib/types';
import { NLP_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type { ParseNLPDateRequest, ParseNLPDateResponse } from './type';

// Stateless date-text parsing (NIC-1931/1932). No cache tag, no WS event —
// every call is a one-off fire-and-forget lookup, never invalidated.
export const nlpApi = createApi({
  reducerPath: 'nlpApi',
  baseQuery: baseQueryWithReauth,
  endpoints: builder => ({
    parseNLPDate: builder.mutation<ParseNLPDateResponse, ParseNLPDateRequest>({
      query: body => ({ url: NLP_API.PARSE_DATE, method: 'POST', body }),
      transformResponse: (raw: ApiEnvelope<ParseNLPDateResponse>) => raw.data,
      transformErrorResponse: error => error.data,
    }),
  }),
});

export const { useParseNLPDateMutation } = nlpApi;
