import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { areaApi, authApi, authReducer, bucketApi, projectApi, taskApi } from '@/lib/store/slices';

const storyRootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [projectApi.reducerPath]: projectApi.reducer,
  [areaApi.reducerPath]: areaApi.reducer,
  [taskApi.reducerPath]: taskApi.reducer,
  [bucketApi.reducerPath]: bucketApi.reducer,
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
        bucketApi.middleware
      ),
  });
