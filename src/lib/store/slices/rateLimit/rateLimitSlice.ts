import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../../store';

export interface RateLimitState {
  // Epoch ms when the user may retry, or null when not rate-limited.
  retryAt: number | null;
}

const initialState: RateLimitState = {
  retryAt: null,
};

const rateLimitSlice = createSlice({
  name: 'rateLimit',
  initialState,
  reducers: {
    // Keep the latest (furthest-out) retry time so a burst of 429s doesn't shorten it.
    setRateLimited: (state, action: PayloadAction<number>) => {
      state.retryAt = state.retryAt ? Math.max(state.retryAt, action.payload) : action.payload;
    },
    clearRateLimit: state => {
      state.retryAt = null;
    },
  },
});

export const selectRateLimitRetryAt = (state: RootState) => state.rateLimit.retryAt;

export const { setRateLimited, clearRateLimit } = rateLimitSlice.actions;

export default rateLimitSlice.reducer;
