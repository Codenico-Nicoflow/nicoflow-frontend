import type { Decorator } from '@storybook/react';
import { Provider } from 'react-redux';

import { LoadingOverlayProvider } from '@/components/LoadingOverlayProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/Toaster';

import { createStoryStore, type StoryRootState } from '../store/storybookStore';

type Theme = 'light' | 'dark' | 'system';

export const withStoryProviders: Decorator = (Story, context) => {
  // Stories can seed the store (e.g. auth.user for UserMenu/Topbar) via
  // parameters.preloadedState.
  const preloadedState = context.parameters.preloadedState as Partial<StoryRootState> | undefined;
  const store = createStoryStore(preloadedState);
  const globals = context.globals as { theme?: Theme };
  const theme: Theme = globals.theme ?? 'light';

  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme={theme} storageKey="storybook-ui-theme">
        <LoadingOverlayProvider>
          <Story />
          <Toaster />
        </LoadingOverlayProvider>
      </ThemeProvider>
    </Provider>
  );
};
