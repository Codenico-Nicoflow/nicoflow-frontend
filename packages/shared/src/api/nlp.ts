import type { ApiEnvelope } from '@nicoflow/shared/types';
import { NLP_API } from '@nicoflow/shared/types';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiBaseQuery } from './area';
import type { ParseNLPDateRequest, ParseNLPDateResponse } from './nlp.types';

// Stateless date-text parsing (NIC-1931/1932). No cache tag, no WS event —
// every call is a one-off fire-and-forget lookup, never invalidated.
export const createNlpApi = (baseQuery: ApiBaseQuery) => {
  const nlpApi = createApi({
    reducerPath: 'nlpApi',
    baseQuery,
    endpoints: builder => ({
      parseNLPDate: builder.mutation<ParseNLPDateResponse, ParseNLPDateRequest>({
        query: body => ({ url: NLP_API.PARSE_DATE, method: 'POST', body }),
        transformResponse: (raw: ApiEnvelope<ParseNLPDateResponse>) => raw.data,
        transformErrorResponse: error => error.data,
      }),
    }),
  });

  return nlpApi;
};
