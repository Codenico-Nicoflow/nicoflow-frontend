import type { Decorator } from '@storybook/react';
import { Provider } from 'react-redux';

import { LoadingOverlayProvider } from '@/components/LoadingOverlayProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/Toaster';

import { createStoryStore } from '../store/storybookStore';

type Theme = 'light' | 'dark' | 'system';

export const withStoryProviders: Decorator = (Story, context) => {
  const store = createStoryStore();
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
