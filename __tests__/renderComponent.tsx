import React from 'react';

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { LoadingOverlayProvider } from '@/components/loading-overlay/LoadingOverlayProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { authApi, bucketApi, categoryApi, projectApi, taskApi } from '@/lib/store';

type AuthState = { user: null; token: null; isAuthenticated: boolean };
type AuthAction =
  | { type: 'auth/setUser'; payload: null }
  | { type: 'auth/clearAuth' }
  | { type: string; [key: string]: unknown };

const authReducer = (
  state: AuthState = { user: null, token: null, isAuthenticated: false },
  action: AuthAction
): AuthState => {
  if (action.type === 'auth/setUser') {
    return { ...state, user: action.payload as null, isAuthenticated: true };
  }
  if (action.type === 'auth/clearAuth') {
    return { user: null, token: null, isAuthenticated: false };
  }
  return state;
};

const createRootReducer = () =>
  combineReducers({
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [bucketApi.reducerPath]: bucketApi.reducer,
  });

type RootReducer = ReturnType<typeof createRootReducer>;
type MockRootState = ReturnType<RootReducer>;

// Create a mock store helper for testing
export const createMockStore = (preloadedState?: Partial<MockRootState>) => {
  const rootReducer = createRootReducer();

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
