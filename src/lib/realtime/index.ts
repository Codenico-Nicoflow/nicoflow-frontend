// The one real-time mount point consumed by the app (PrivateLayout). The hook,
// banner, and helpers below it are internal to this module — tests import them from
// their concrete files. Kept small so the E-033 shared-package extraction has a
// clear public surface.
export { LiveUpdates } from './LiveUpdates';
