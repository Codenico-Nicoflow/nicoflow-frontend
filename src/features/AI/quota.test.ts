import { describe, expect, it } from 'vitest';

import { applyServerBlock, deriveQuota, isFeatureDisabled, isQuotaBlocked } from './quota';
import type { AIUsageView } from './types';

const free = (used: number, limit = 5): AIUsageView => ({ used, limit, scope: 'lifetime', month: null });
const pro = (used: number, limit = 500): AIUsageView => ({ used, limit, scope: 'month', month: '2026-07' });

describe('deriveQuota', () => {
  it('returns undefined while usage is unknown so the composer stays usable', () => {
    expect(deriveQuota(undefined)).toBeUndefined();
  });

  it('reports ok under the free cap', () => {
    expect(deriveQuota(free(2))).toMatchObject({ state: 'ok', canUpgrade: false, percent: 40 });
  });

  it('exhausts a free user at the cap and offers an upgrade', () => {
    expect(deriveQuota(free(5))).toMatchObject({ state: 'exhausted', canUpgrade: true, percent: 100 });
  });

  it('stays exhausted above the cap and clamps the meter to 100', () => {
    expect(deriveQuota(free(9))).toMatchObject({ state: 'exhausted', canUpgrade: true, percent: 100 });
  });

  it('reports ok under the pro monthly cap', () => {
    expect(deriveQuota(pro(250))).toMatchObject({ state: 'ok', scope: 'month', percent: 50 });
  });

  it('exhausts a pro user at the monthly cap without offering an upgrade', () => {
    expect(deriveQuota(pro(500))).toMatchObject({ state: 'exhausted', canUpgrade: false });
  });

  it('never divides by a zero limit', () => {
    expect(deriveQuota({ used: 0, limit: 0, scope: 'lifetime', month: null })).toMatchObject({
      state: 'ok',
      percent: 0,
    });
  });

  it('clamps negative and non-finite payload values instead of rendering NaN', () => {
    const derived = deriveQuota({ used: -3, limit: Number.NaN, scope: 'month', month: '2026-07' });
    expect(derived).toMatchObject({ used: 0, limit: 0, percent: 0, state: 'ok' });
  });
});

describe('applyServerBlock', () => {
  it('exhausts a stale free quota and offers the upgrade', () => {
    expect(applyServerBlock(deriveQuota(free(1)))).toMatchObject({
      state: 'exhausted',
      canUpgrade: true,
      used: 5,
      percent: 100,
    });
  });

  it('exhausts a stale pro quota without offering an upgrade', () => {
    expect(applyServerBlock(deriveQuota(pro(3)))).toMatchObject({
      state: 'exhausted',
      canUpgrade: false,
      used: 500,
    });
  });

  it('leaves an already-exhausted quota untouched', () => {
    const derived = deriveQuota(free(5));
    expect(applyServerBlock(derived)).toBe(derived);
  });

  it('passes through an unknown quota', () => {
    expect(applyServerBlock(undefined)).toBeUndefined();
  });
});

describe('error-code guards', () => {
  it('treats only AI_UNAVAILABLE as feature-disabled', () => {
    expect(isFeatureDisabled('AI_UNAVAILABLE')).toBe(true);
    expect(isFeatureDisabled('AI_LIMIT_REACHED')).toBe(false);
    expect(isFeatureDisabled(undefined)).toBe(false);
  });

  it('treats only AI_LIMIT_REACHED as a quota block', () => {
    expect(isQuotaBlocked('AI_LIMIT_REACHED')).toBe(true);
    expect(isQuotaBlocked('AI_PROVIDER_ERROR')).toBe(false);
    expect(isQuotaBlocked(undefined)).toBe(false);
  });
});
