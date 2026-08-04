import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { aiApi } from './slices/ai/aiApi';
import { areaApi } from './slices/area/areaApi';
import { attachmentApi } from './slices/attachment/attachmentApi';
import { authApi } from './slices/auth/authApi';
import authReducer, { clearAuth } from './slices/auth/authSlice';
import { bucketApi } from './slices/bucket/bucketApi';
import focusLiveReducer from './slices/focusSession/focusLiveSlice';
import { focusSessionApi } from './slices/focusSession/focusSessionApi';
import { googleCalendarApi } from './slices/googleCalendar/googleCalendarApi';
import { noteApi } from './slices/note/noteApi';
import { notificationApi } from './slices/notification/notificationApi';
import { projectApi } from './slices/project/projectApi';
import rateLimitReducer from './slices/rateLimit/rateLimitSlice';
import { recurrenceApi } from './slices/recurrence/recurrenceApi';
import { searchApi } from './slices/search/searchApi';
import { subtaskApi } from './slices/subtasks/subtaskApi';
import { taskApi } from './slices/tasks/taskApi';

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
      noteApi.middleware
    ),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
