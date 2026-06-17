import type { Preview } from '@storybook/react';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { reactRouterParameters, withRouter } from 'storybook-addon-remix-react-router';

import { handlers } from '../src/mocks/handlers';
import { withStoryProviders } from '../src/stories/decorators/withStoryProviders';

import '../src/index.css';

// MSW must be initialized before any story renders so RTK Query calls are
// intercepted. Stories override per-case via parameters.msw.handlers.
initialize({ onUnhandledRequest: 'bypass' });

const preview: Preview = {
  decorators: [withStoryProviders, withRouter()],
  loaders: [mswLoader],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
          { value: 'system', icon: 'browser', title: 'System' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
    a11y: {
      // Default context is `body` (SB 8.5+) so it resolves in the Vitest
      // browser frame too; pinning it to #storybook-root broke axe there.
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    reactRouter: reactRouterParameters({ routing: { path: '/' } }),
    msw: { handlers },
  },
};

export default preview;
