import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { areaApi } from '@/lib/store/slices/area/areaApi';
import { authApi } from '@/lib/store/slices/auth/authApi';
import authReducer from '@/lib/store/slices/auth/authSlice';
import { bucketApi } from '@/lib/store/slices/bucket/bucketApi';
import { projectApi } from '@/lib/store/slices/project/projectApi';
import { taskApi } from '@/lib/store/slices/tasks/taskApi';

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
