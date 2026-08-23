// The save lifecycle as the UI sees it. Deliberately a closed union rather than
// a pile of booleans: "saving" and "conflict" must never be true at once, and a
// boolean pair makes that state representable.
export const SaveStatus = {
  /** No pending edits and nothing in flight. */
  IDLE: 'idle',
  /** Edited since the last successful save; a save is scheduled but not sent. */
  UNSAVED: 'unsaved',
  /** A PATCH is in flight. */
  SAVING: 'saving',
  /** The last save landed. Only ever set from a resolved response. */
  SAVED: 'saved',
  /** 409 — the stored document moved on. TERMINAL: autosave never resumes. */
  CONFLICT: 'conflict',
  /** A non-conflict failure (422 oversize, network). Retryable by editing again. */
  ERROR: 'error',
} as const;

export type SaveStatusValue = (typeof SaveStatus)[keyof typeof SaveStatus];

// ~3s: long enough that active editing (typing, several toolbar clicks in a
// row) doesn't fire a save mid-thought, short enough that a user who tabs
// away has almost certainly been saved.
export const AUTOSAVE_DEBOUNCE_MS = 3000;
