import { describe, expect, it } from 'vitest';

import { formatBytes } from './formatBytes';

describe('formatBytes', () => {
  it('formats bytes below 1 KB without a decimal', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats KB with a trimmed decimal', () => {
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats MB and GB', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
  });

  it('caps at GB for very large sizes', () => {
    expect(formatBytes(3 * 1024 ** 4)).toBe('3072 GB');
  });

  it('returns 0 B for zero, negatives and non-finite input', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-10)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });
});
