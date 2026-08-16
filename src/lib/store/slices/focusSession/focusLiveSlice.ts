import type { IFocusSession } from '@nicoflow/shared/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../../store';

import type { FocusLiveEvent } from './type';

export interface FocusLiveState {
  last: FocusLiveEvent | null;
}

const initialState: FocusLiveState = { last: null };

// Conduit between the WebSocket and the focus timer hook: useWebSocket writes
// every focus.session_started/ended event here; the hook reacts (cross-tab
// zombie-tick stop, sweep-closed freeze). Deliberately not persisted.
const focusLiveSlice = createSlice({
  name: 'focusLive',
  initialState,
  reducers: {
    focusWsEvent: (state, action: PayloadAction<{ kind: 'started' | 'ended'; session: IFocusSession }>) => {
      state.last = { ...action.payload, seq: (state.last?.seq ?? 0) + 1 };
    },
  },
});

export const selectFocusLive = (state: RootState) => state.focusLive.last;

export const { focusWsEvent } = focusLiveSlice.actions;

export default focusLiveSlice.reducer;
