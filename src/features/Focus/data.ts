/** Time-budget chips: minutes sent as `available` to GET /focus (SPEC §3.4). */
export interface TimeChip {
  /** Stable id used for testids and i18n keys — never localized. */
  id: 'm15' | 'm30' | 'h1' | 'h2plus';
  minutes: number;
}

// "2h+" means "a long stretch" — 240 keeps the time-fit scoring meaningful
// while effectively not excluding anything reasonable.
export const TIME_CHIPS: TimeChip[] = [
  { id: 'm15', minutes: 15 },
  { id: 'm30', minutes: 30 },
  { id: 'h1', minutes: 60 },
  { id: 'h2plus', minutes: 240 },
];

/** Max ranked results asked from /focus (server default 5, max 20). */
export const FOCUS_LIMIT = 5;
