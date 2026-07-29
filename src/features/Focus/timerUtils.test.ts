import { describe, expect, it } from 'vitest';

import { estimateProgress, formatClock } from './timerUtils';

describe('formatClock', () => {
  it('renders minutes:seconds under an hour', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(5)).toBe('00:05');
    expect(formatClock(332)).toBe('05:32');
    expect(formatClock(3599)).toBe('59:59');
  });

  it('adds the hour digit past an hour', () => {
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(3932)).toBe('1:05:32');
    expect(formatClock(36_000)).toBe('10:00:00');
  });

  it('clamps negatives and floors fractions', () => {
    expect(formatClock(-5)).toBe('00:00');
    expect(formatClock(61.9)).toBe('01:01');
  });
});

describe('estimateProgress', () => {
  it('is the actual/estimate ratio', () => {
    expect(estimateProgress(900, 30)).toBe(0.5);
    expect(estimateProgress(1800, 30)).toBe(1);
    expect(estimateProgress(3600, 30)).toBe(2);
  });

  it('is null without a usable estimate', () => {
    expect(estimateProgress(900, null)).toBeNull();
    expect(estimateProgress(900, undefined)).toBeNull();
    expect(estimateProgress(900, 0)).toBeNull();
  });
});
