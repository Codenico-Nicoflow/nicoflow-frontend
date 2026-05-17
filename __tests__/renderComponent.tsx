import React from 'react';

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { LoadingOverlayProvider, ThemeProvider } from '@/components';
import { areaApi, authApi, bucketApi, projectApi, taskApi } from '@/lib/store';
import type { AuthState } from '@/lib/store/slices/auth/authSlice';
import authReducer from '@/lib/store/slices/auth/authSlice';

const createRootReducer = () =>
  combineReducers({
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [areaApi.reducerPath]: areaApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [bucketApi.reducerPath]: bucketApi.reducer,
  });

type RootReducer = ReturnType<typeof createRootReducer>;
type MockRootState = ReturnType<RootReducer>;

export const createMockStore = (preloadedState?: { auth?: Partial<AuthState> }) => {
  const rootReducer = createRootReducer();

  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as Partial<MockRootState>,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(
        authApi.middleware,
        projectApi.middleware,
        areaApi.middleware,
        taskApi.middleware,
        bucketApi.middleware
      ),
  });
};

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: ReturnType<typeof createMockStore>;
  initialRoute?: string;
}

export const renderComponent = (ui: React.ReactElement, options?: RenderWithProvidersOptions) => {
  const { store = createMockStore(), initialRoute = '/', ...renderOptions } = options || {};

  window.history.pushState({}, 'Test page', initialRoute);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="test-ui-theme">
          <LoadingOverlayProvider>{children}</LoadingOverlayProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
