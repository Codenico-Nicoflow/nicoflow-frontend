import type { GoogleStatus } from '@/lib/store';

/**
 * Which Google status the user has already waved away, in localStorage.
 *
 * Keyed by the STATUS, not a bare boolean: someone who dismissed a transient
 * "unavailable" strip has not answered "your connection is dead and needs
 * reconnecting". A boolean would silence the second, more important message
 * because they dismissed the first.
 *
 * localStorage rather than the backend because this is a per-device nag
 * preference, not account state — mirrors the timezone-drift banner.
 */
const STORAGE_KEY = 'nicoflow-google-status-dismissed';

export const isStatusDismissed = (status: GoogleStatus): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === status;
  } catch {
    // Private mode / disabled storage: treat as not dismissed. Erring toward
    // showing the strip is right — silently hiding a broken calendar is the
    // failure this feature exists to prevent.
    return false;
  }
};

export const dismissStatus = (status: GoogleStatus): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, status);
  } catch {
    // Storage unavailable — the strip reappears next mount. Acceptable.
  }
};

/**
 * Clear the record once the connection is healthy again, so the next genuine
 * failure is not pre-dismissed by an answer to an older, unrelated one.
 */
export const clearDismissedStatus = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
};
