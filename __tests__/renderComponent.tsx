import React from 'react';

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render, type RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { LoadingOverlayProvider, ThemeProvider } from '@/components';
import i18n from '@/lib/i18n';
import {
  aiApi,
  areaApi,
  attachmentApi,
  authApi,
  bucketApi,
  focusSessionApi,
  notificationApi,
  projectApi,
  recurrenceApi,
  searchApi,
  subtaskApi,
  taskApi,
} from '@/lib/store';
import type { AuthState } from '@/lib/store/slices/auth/authSlice';
import authReducer from '@/lib/store/slices/auth/authSlice';
import focusLiveReducer from '@/lib/store/slices/focusSession/focusLiveSlice';
import type { RateLimitState } from '@/lib/store/slices/rateLimit/rateLimitSlice';
import rateLimitReducer from '@/lib/store/slices/rateLimit/rateLimitSlice';

const createRootReducer = () =>
  combineReducers({
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
  });

type RootReducer = ReturnType<typeof createRootReducer>;
type MockRootState = ReturnType<RootReducer>;

export const createMockStore = (preloadedState?: {
  auth?: Partial<AuthState>;
  rateLimit?: Partial<RateLimitState>;
}) => {
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
        subtaskApi.middleware,
        bucketApi.middleware,
        searchApi.middleware,
        notificationApi.middleware,
        attachmentApi.middleware,
        aiApi.middleware,
        recurrenceApi.middleware,
        focusSessionApi.middleware
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
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="light" storageKey="test-ui-theme">
            <LoadingOverlayProvider>{children}</LoadingOverlayProvider>
          </ThemeProvider>
        </BrowserRouter>
      </I18nextProvider>
    </Provider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
