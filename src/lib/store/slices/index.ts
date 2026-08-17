// createApi() slice instances are constructed once in ../store.ts (via the
// @nicoflow/shared/api factories) and re-exported here for consumers that
// still import from this path.
export {
  aiApi,
  areaApi,
  attachmentApi,
  authApi,
  bucketApi,
  focusSessionApi,
  googleCalendarApi,
  habitApi,
  nlpApi,
  noteApi,
  notificationApi,
  projectApi,
  recurrenceApi,
  searchApi,
  subtaskApi,
  taskApi,
} from '../store';

// Plain Redux reducers stay local to the web app (store-configuration
// concerns — RootState-coupled selectors, persistence).
export { default as authReducer, clearAuth, selectAuth, selectIsLoading, selectUser, setUser } from './auth/authSlice';
export { default as focusLiveReducer, focusWsEvent, selectFocusLive } from './focusSession/focusLiveSlice';
export {
  clearRateLimit,
  default as rateLimitReducer,
  selectRateLimitRetryAt,
  setRateLimited,
} from './rateLimit/rateLimitSlice';
