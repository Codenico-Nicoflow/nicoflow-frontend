import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { setProjectAnnotations } from '@storybook/react-vite';

import * as projectAnnotations from './preview';

// Applies the same decorators/parameters/loaders the Storybook UI uses
// (theme, store, MSW, a11y) when stories run as Vitest browser tests.
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
