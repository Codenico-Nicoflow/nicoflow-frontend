import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { authApi } from './slices/auth/authApi';
import authReducer from './slices/auth/authSlice';
import { bucketApi } from './slices/bucket/bucketApi';
import { categoryApi } from './slices/category/categoryApi';
import { projectApi } from './slices/project/projectApi';
import { taskApi } from './slices/tasks/taskApi';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist the auth slice
};

const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [projectApi.reducerPath]: projectApi.reducer,
  [categoryApi.reducerPath]: categoryApi.reducer,
  [taskApi.reducerPath]: taskApi.reducer,
  [bucketApi.reducerPath]: bucketApi.reducer,
});

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
      categoryApi.middleware,
      taskApi.middleware,
      bucketApi.middleware
    ),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
