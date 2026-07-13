import { combineReducers, configureStore } from '@reduxjs/toolkit';

import {
  areaApi,
  authApi,
  authReducer,
  bucketApi,
  projectApi,
  rateLimitReducer,
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
        searchApi.middleware
      ),
  });
