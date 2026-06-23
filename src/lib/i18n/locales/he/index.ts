import type { Resources } from '../en';

import area from './area.json';
import auth from './auth.json';
import bucket from './bucket.json';
import common from './common.json';
import errors from './errors.json';
import nav from './nav.json';
import project from './project.json';
import task from './task.json';

// `satisfies` enforces that every EN namespace is present and key-compatible so
// a missing/renamed key fails type-check here, while leaving room for any
// language-specific plural variants (matching the ru barrel's shape).
export const he = { common, auth, area, project, task, bucket, nav, errors } satisfies Record<keyof Resources, unknown>;
