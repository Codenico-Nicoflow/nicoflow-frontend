import type { ApiEnvelope } from '@nicoflow/shared/types';
import { FOCUS_SESSION_API } from '@nicoflow/shared/types';
import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQueryWithReauth } from '../baseQuery';

import type { CloseFocusSessionResponse, OpenFocusSessionRequest, OpenFocusSessionResponse } from './type';

// Focus timer sessions (E-049). Mutations only — the backend exposes no GET for
// the current segment; the running-tab state lives in the timer hook and the
// cross-tab view arrives over WS (focusLiveSlice). Cumulative totals are read
// through taskApi ('Focus' tag), which callers invalidate after a close.
export const focusSessionApi = createApi({
  reducerPath: 'focusSessionApi',
  baseQuery: baseQueryWithReauth,
  endpoints: builder => ({
    openFocusSession: builder.mutation<OpenFocusSessionResponse, OpenFocusSessionRequest>({
      query: body => ({ url: FOCUS_SESSION_API.OPEN, method: 'POST', body }),
      transformResponse: (raw: ApiEnvelope<OpenFocusSessionResponse>) => raw.data,
      transformErrorResponse: error => error.data,
    }),
    closeFocusSession: builder.mutation<CloseFocusSessionResponse, void>({
      query: () => ({ url: FOCUS_SESSION_API.CLOSE, method: 'POST' }),
      transformResponse: (raw: ApiEnvelope<CloseFocusSessionResponse>) => raw.data,
      transformErrorResponse: error => error.data,
    }),
    // 204 with no body — silent by contract, never broadcasts.
    focusHeartbeat: builder.mutation<void, void>({
      query: () => ({ url: FOCUS_SESSION_API.HEARTBEAT, method: 'POST' }),
      transformErrorResponse: error => error.data,
    }),
  }),
});

export const { useOpenFocusSessionMutation, useCloseFocusSessionMutation, useFocusHeartbeatMutation } = focusSessionApi;
