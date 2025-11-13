import React from 'react';

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { authApi, bucketApi, categoryApi, projectApi, taskApi } from '@my-monorepo/store';

import { LoadingOverlayProvider } from '@/components/loading-overlay/LoadingOverlayProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

// Create a simple auth reducer for testing (no need for the full slice with persistence)
const authReducer = (state = { user: null, token: null, isAuthenticated: false }, action: any) => {
  switch (action.type) {
    case 'auth/setUser':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'auth/clearAuth':
      return { user: null, token: null, isAuthenticated: false };
    default:
      return state;
  }
};

// Create a mock store helper for testing
export const createMockStore = (preloadedState?: any) => {
  const rootReducer = combineReducers({
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [bucketApi.reducerPath]: bucketApi.reducer,
  });

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(
        authApi.middleware,
        projectApi.middleware,
        categoryApi.middleware,
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

  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

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
