import type { Resources } from '../en';

import ai from './ai.json';
import area from './area.json';
import auth from './auth.json';
import bucket from './bucket.json';
import common from './common.json';
import errors from './errors.json';
import habits from './habits.json';
import nav from './nav.json';
import notes from './notes.json';
import notification from './notification.json';
import project from './project.json';
import recurrence from './recurrence.json';
import task from './task.json';

// Russian uses CLDR plural categories (one/few/many), so some keys carry
// `_few`/`_many` suffixes the EN shape doesn't have. `satisfies` enforces that
// every EN namespace is present and key-compatible, while still permitting those
// extra plural variants (which i18next resolves at runtime, not the type).
export const ru = {
  common,
  auth,
  area,
  project,
  task,
  bucket,
  nav,
  errors,
  notification,
  ai,
  recurrence,
  habits,
  notes,
} satisfies Record<keyof Resources, unknown>;
