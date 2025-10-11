import React from 'react';

import type { Preview } from '@storybook/react';
import { reactRouterParameters,withRouter } from 'storybook-addon-remix-react-router';

import '@/styles/globals.css';

const preview: Preview = {
  decorators: [withRouter, Story => <Story />],
  parameters: {
    reactRouter: reactRouterParameters({
      // you can define an initial location and route params here for stories
      routing: {
        path: '/',
      },
    }),
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
};

export default preview;
