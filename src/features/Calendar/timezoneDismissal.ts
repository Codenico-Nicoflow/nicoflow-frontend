// Which drift the user has already waved away, kept in localStorage.
//
// Keyed by the zone *pair*, not a bare boolean: someone who dismisses
// "account Asia/Jerusalem vs browser Europe/London" has answered that
// question, but flying on to America/New_York is a new one worth asking. A
// boolean would silence the banner forever after the first trip.
//
// localStorage rather than the backend because this is a per-device nag
// preference, not account state — the same account on a phone at home should
// not inherit a dismissal made on a laptop abroad.
const STORAGE_KEY = 'nicoflow-tz-drift-dismissed';

const pairKey = (accountZone: string, browserZone: string): string => `${accountZone}>${browserZone}`;

export const isDriftDismissed = (accountZone: string, browserZone: string): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === pairKey(accountZone, browserZone);
  } catch {
    // Private-mode / disabled storage: never dismissed, which errs toward
    // showing the banner. Silently hiding it would be the worse failure.
    return false;
  }
};

export const dismissDrift = (accountZone: string, browserZone: string): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, pairKey(accountZone, browserZone));
  } catch {
    // Storage unavailable — the banner reappears next mount. Acceptable.
  }
};

/** Clear the record, so a resolved drift doesn't suppress a later genuine one. */
export const clearDriftDismissal = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage never worked.
  }
};
