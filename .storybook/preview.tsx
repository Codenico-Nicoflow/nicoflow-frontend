import type { Preview } from '@storybook/react';
import { reactRouterParameters, withRouter } from 'storybook-addon-remix-react-router';

import { withStoryProviders } from '../src/stories/decorators/withStoryProviders';

import '../src/index.css';

const preview: Preview = {
  decorators: [withStoryProviders, withRouter()],
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
    a11y: { element: '#storybook-root' },
    reactRouter: reactRouterParameters({ routing: { path: '/' } }),
  },
};

export default preview;
