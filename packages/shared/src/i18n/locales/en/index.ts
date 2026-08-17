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

// English is the source-of-record locale: it's the fallback language and the
// shape every other locale (and the typed-key declaration in i18next.d.ts) is
// derived from. Keep all keys present here even if a translation is pending —
// missing keys fall back to EN at runtime and fail type-check at build.
export const en = {
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
} as const;

export type Resources = typeof en;
