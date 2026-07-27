// Pure quota derivation for the AI assistant. No React / DOM / RTK imports so it
// stays framework-agnostic for the E-033 shared-package extraction and is unit
// testable on its own. The backend is the authority on the quota (it re-checks on
// every send); this only decides what the UI shows.

import type { AIUsageView } from './types';

// The §4 codes that drive AI UX. Kept as a const map (not a bare union) so the
// mapping table and the guards below share one source of truth.
export const AI_ERROR_CODE = {
  LIMIT_REACHED: 'AI_LIMIT_REACHED',
  UNAVAILABLE: 'AI_UNAVAILABLE',
  PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  STREAM_ACTIVE: 'AI_STREAM_ACTIVE',
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

export type AIErrorCode = (typeof AI_ERROR_CODE)[keyof typeof AI_ERROR_CODE];

// What the surface should render for a given quota state.
//   ok        — under the cap, normal composer
//   exhausted — at/over the cap; `scope` decides upsell (lifetime) vs wait (month)
export type QuotaState = 'ok' | 'exhausted';

export interface QuotaStatus {
  state: QuotaState;
  used: number;
  limit: number;
  scope: AIUsageView['scope'];
  // True only when the block is liftable by upgrading — a lifetime (Free) cap.
  // A Pro monthly cap is not an upsell; it resets, so we show a notice instead.
  canUpgrade: boolean;
  // Clamped 0–100 for the meter. Guards a 0/negative limit so a bad payload can
  // never produce NaN/Infinity width.
  percent: number;
}

// deriveQuota turns a usage payload into the render decision. `usage` is
// undefined while the query is in flight or has failed — that is NOT a block:
// the composer stays usable and the server remains the authority.
export const deriveQuota = (usage: AIUsageView | undefined): QuotaStatus | undefined => {
  if (!usage) return undefined;

  const limit = Number.isFinite(usage.limit) ? Math.max(0, usage.limit) : 0;
  const used = Number.isFinite(usage.used) ? Math.max(0, usage.used) : 0;
  const exhausted = limit > 0 && used >= limit;

  return {
    state: exhausted ? 'exhausted' : 'ok',
    used,
    limit,
    scope: usage.scope,
    canUpgrade: exhausted && usage.scope === 'lifetime',
    percent: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
  };
};

// isFeatureDisabled reports whether a §4 code means the assistant itself is off
// (kill switch / no provider key → 503 AI_UNAVAILABLE), as opposed to a per-user
// quota block. Keyed off the code, never the HTTP status.
export const isFeatureDisabled = (code: string | undefined): boolean => code === AI_ERROR_CODE.UNAVAILABLE;

// isQuotaBlocked reports whether a code means this user is out of requests. A
// send that returns this hardens the wall even when the cached usage is stale.
export const isQuotaBlocked = (code: string | undefined): boolean => code === AI_ERROR_CODE.LIMIT_REACHED;

// applyServerBlock folds an authoritative AI_LIMIT_REACHED from a send into the
// derived quota. Cached counters can lag the server (quota spent in another tab,
// or a refund/reset in between), so a live 429 wins: the state becomes exhausted
// and `used` is pulled up to the cap so the meter agrees with the wall. The scope
// still decides upsell vs. wait — a Pro monthly cap never becomes an upsell.
export const applyServerBlock = (quota: QuotaStatus | undefined): QuotaStatus | undefined => {
  if (!quota || quota.state === 'exhausted') return quota;

  return {
    ...quota,
    state: 'exhausted',
    used: Math.max(quota.used, quota.limit),
    canUpgrade: quota.scope === 'lifetime',
    percent: 100,
  };
};
