import { describe, expect, it } from 'vitest';

import { formatHour } from './HourPicker';

describe('formatHour', () => {
  it('formats morning hours as AM', () => {
    expect(formatHour(5)).toBe('5:00 AM');
    expect(formatHour(8)).toBe('8:00 AM');
    expect(formatHour(11)).toBe('11:00 AM');
  });

  it('formats evening hours as PM', () => {
    expect(formatHour(18)).toBe('6:00 PM');
    expect(formatHour(20)).toBe('8:00 PM');
    expect(formatHour(22)).toBe('10:00 PM');
  });

  it('formats noon and midnight edge hours', () => {
    expect(formatHour(12)).toBe('12:00 PM');
    expect(formatHour(0)).toBe('12:00 AM');
  });
});
