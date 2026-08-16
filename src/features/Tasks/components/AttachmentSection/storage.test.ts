import type { IAttachment } from '@nicoflow/shared/types';
import { describe, expect, it } from 'vitest';

import { formatMegabytes, STORAGE_LIMIT_BYTES, storageLevel, sumBytes, usageRatio } from './storage';

const MB = 1024 * 1024;

const att = (fileSize: number): IAttachment => ({
  id: crypto.randomUUID(),
  ownerType: 'task',
  ownerId: 't1',
  fileName: 'f',
  fileSize,
  mimeType: 'application/pdf',
  createdAt: '2026-07-24T08:00:00Z',
});

describe('storage math', () => {
  it('sums attachment byte sizes', () => {
    expect(sumBytes([att(10 * MB), att(20 * MB), att(5 * MB)])).toBe(35 * MB);
    expect(sumBytes([])).toBe(0);
  });

  it('caps usageRatio at 1 when over the limit', () => {
    expect(usageRatio(50 * MB)).toBeCloseTo(0.5);
    expect(usageRatio(STORAGE_LIMIT_BYTES)).toBe(1);
    expect(usageRatio(200 * MB)).toBe(1);
  });

  it('formats bytes to one-decimal MB', () => {
    expect(formatMegabytes(82 * MB)).toBe('82.0 MB');
    expect(formatMegabytes(STORAGE_LIMIT_BYTES)).toBe('100.0 MB');
    expect(formatMegabytes(0)).toBe('0.0 MB');
  });
});

describe('storageLevel thresholds', () => {
  it.each([
    [0, 'ok'],
    [0.74, 'ok'],
    [0.75, 'warning'],
    [0.82, 'warning'],
    [0.94, 'warning'],
    [0.95, 'critical'],
    [1, 'critical'],
  ] as const)('ratio %f → %s', (ratio, expected) => {
    expect(storageLevel(ratio)).toBe(expected);
  });
});
