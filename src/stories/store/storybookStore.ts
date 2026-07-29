import { combineReducers, configureStore } from '@reduxjs/toolkit';

import {
  aiApi,
  areaApi,
  attachmentApi,
  authApi,
  authReducer,
  bucketApi,
  notificationApi,
  projectApi,
  rateLimitReducer,
  recurrenceApi,
  searchApi,
  subtaskApi,
  taskApi,
} from '@/lib/store/slices';

const storyRootReducer = combineReducers({
  auth: authReducer,
  rateLimit: rateLimitReducer,
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
});

export type StoryRootState = ReturnType<typeof storyRootReducer>;

export const createStoryStore = (preloadedState?: Partial<StoryRootState>) =>
  configureStore({
    reducer: storyRootReducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false }).concat(
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
        recurrenceApi.middleware
      ),
  });
