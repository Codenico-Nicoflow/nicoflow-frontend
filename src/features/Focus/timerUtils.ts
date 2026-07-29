// Pure timer helpers — framework-agnostic so they survive the E-033 shared-
// package extraction.

export const TICK_INTERVAL_MS = 1_000;
// ~30s heartbeat cadence: the backend sweep's 90s stale threshold is 3× this,
// so one dropped beat never costs a live user their timer.
export const HEARTBEAT_INTERVAL_MS = 30_000;
export const IDLE_TIMEOUT_MS = 5 * 60_000;

// Formats seconds as a clock: "05:32", or "1:05:32" past an hour.
export const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

// Actual-vs-estimate ratio (1 = exactly on estimate, >1 = over), or null when
// the task has no usable estimate. Callers cap the drawn ring at 1.
export const estimateProgress = (seconds: number, estimatedMinutes: number | null | undefined): number | null => {
  if (!estimatedMinutes || estimatedMinutes <= 0) return null;
  return seconds / (estimatedMinutes * 60);
};
