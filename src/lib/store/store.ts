import {
  createAiApi,
  createAreaApi,
  createAttachmentApi,
  createAuthApi,
  createBucketApi,
  createFocusSessionApi,
  createGoogleCalendarApi,
  createHabitApi,
  createNlpApi,
  createNoteApi,
  createNotificationApi,
  createProjectApi,
  createRecurrenceApi,
  createSearchApi,
  createSubtaskApi,
  createTaskApi,
} from '@nicoflow/shared/api';
import { combineReducers, configureStore, type UnknownAction } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { resolveTimeZone } from '@/lib/utils';

import authReducer, { clearAuth, setToken, setUser } from './slices/auth/authSlice';
import { createBaseQueryWithReauth } from './slices/baseQuery';
import focusLiveReducer from './slices/focusSession/focusLiveSlice';
import rateLimitReducer from './slices/rateLimit/rateLimitSlice';
import { createWebTokenStorage } from './slices/tokenStorage';

// webTokenStorage is constructed before the store exists, so its accessors are
// late-bound: they close over `store` (assigned below, after configureStore())
// rather than capturing a reference to it up front. Every RTK Query call fires
// after configureStore() returns, so by the time any accessor actually runs
// `store` is set — same ordering trick refreshSessionFromStore always relied on.
const lateDispatch = (action: UnknownAction): void => void store.dispatch(action);

export const webTokenStorage = createWebTokenStorage(() => store.getState(), lateDispatch);

// Every createApi() slice now lives in @nicoflow/shared/api as a factory —
// constructed here, once, with the web app's concrete baseQueryWithReauth
// (built around webTokenStorage above). This is the one place platform-
// specific auth storage meets the platform-agnostic slice definitions; the
// factories themselves stay reusable from a future mobile app once it
// supplies its own TokenStorage implementation.
const baseQueryWithReauth = createBaseQueryWithReauth(webTokenStorage);

export const authApi = createAuthApi(baseQueryWithReauth, { clearAuth, setToken, setUser }, resolveTimeZone);
export const areaApi = createAreaApi(baseQueryWithReauth);
export const projectApi = createProjectApi(baseQueryWithReauth, areaApi);
export const taskApi = createTaskApi(baseQueryWithReauth);
export const subtaskApi = createSubtaskApi(baseQueryWithReauth);
export const bucketApi = createBucketApi(baseQueryWithReauth);
export const searchApi = createSearchApi(baseQueryWithReauth);
export const notificationApi = createNotificationApi(baseQueryWithReauth);
export const attachmentApi = createAttachmentApi(baseQueryWithReauth);
export const aiApi = createAiApi(baseQueryWithReauth);
export const recurrenceApi = createRecurrenceApi(baseQueryWithReauth);
export const focusSessionApi = createFocusSessionApi(baseQueryWithReauth);
export const googleCalendarApi = createGoogleCalendarApi(baseQueryWithReauth);
export const noteApi = createNoteApi(baseQueryWithReauth);
export const habitApi = createHabitApi(baseQueryWithReauth);
export const nlpApi = createNlpApi(baseQueryWithReauth);

const apiReducerPaths = [
  authApi.reducerPath,
  projectApi.reducerPath,
  areaApi.reducerPath,
  taskApi.reducerPath,
  subtaskApi.reducerPath,
  bucketApi.reducerPath,
  searchApi.reducerPath,
  notificationApi.reducerPath,
  attachmentApi.reducerPath,
  aiApi.reducerPath,
  recurrenceApi.reducerPath,
  focusSessionApi.reducerPath,
  googleCalendarApi.reducerPath,
  noteApi.reducerPath,
  habitApi.reducerPath,
  nlpApi.reducerPath,
] as const;

const combinedReducer = combineReducers({
  auth: authReducer,
  rateLimit: rateLimitReducer,
  focusLive: focusLiveReducer,
  [authApi.reducerPath]: authApi.reducer,
  [projectApi.reducerPath]: projectApi.reducer,
  [areaApi.reducerPath]: areaApi.reducer,
  [taskApi.reducerPath]: taskApi.reducer,
  [subtaskApi.reducerPath]: subtaskApi.reducer,
  [bucketApi.reducerPath]: bucketApi.reducer,
  [searchApi.reducerPath]: searchApi.reducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [attachmentApi.reducerPath]: attachmentApi.reducer,
  [aiApi.reducerPath]: aiApi.reducer,
  [recurrenceApi.reducerPath]: recurrenceApi.reducer,
  [focusSessionApi.reducerPath]: focusSessionApi.reducer,
  [googleCalendarApi.reducerPath]: googleCalendarApi.reducer,
  [noteApi.reducerPath]: noteApi.reducer,
  [habitApi.reducerPath]: habitApi.reducer,
  [nlpApi.reducerPath]: nlpApi.reducer,
});

type CombinedState = ReturnType<typeof combinedReducer>;

// On logout wipe every RTK Query cache so a different user never sees the
// previous account's cached tasks/badges/etc. Blanking the api slices (passing
// undefined = their own initial state) covers all current and future api slices
// without a manual resetApiState() per mutation.
export const rootReducer = (state: CombinedState | undefined, action: Parameters<typeof combinedReducer>[1]) => {
  if (action.type === clearAuth.type && state) {
    const cleared = { ...state };
    for (const path of apiReducerPaths) delete cleared[path];
    return combinedReducer(cleared as CombinedState, action);
  }
  return combinedReducer(state, action);
};

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      projectApi.middleware,
      areaApi.middleware,
      taskApi.middleware,
      subtaskApi.middleware,
      bucketApi.middleware,
      searchApi.middleware,
      notificationApi.middleware,
      attachmentApi.middleware,
      aiApi.middleware,
      recurrenceApi.middleware,
      focusSessionApi.middleware,
      googleCalendarApi.middleware,
      noteApi.middleware,
      habitApi.middleware,
      nlpApi.middleware
    ),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
