import { describe, expect, it } from 'vitest';

import { formatHour } from './HourPicker';

describe('formatHour', () => {
  it('uses 12h AM/PM for English', () => {
    expect(formatHour(8, 'en')).toBe('8:00 AM');
    expect(formatHour(20, 'en')).toBe('8:00 PM');
    expect(formatHour(12, 'en')).toBe('12:00 PM');
    expect(formatHour(0, 'en')).toBe('12:00 AM');
  });

  it('uses each locale own convention (no hardcoded AM/PM)', () => {
    // he + ru are 24h locales — the label carries no AM/PM.
    for (const locale of ['he', 'ru']) {
      expect(formatHour(20, locale)).not.toMatch(/AM|PM/);
      expect(formatHour(8, locale)).not.toMatch(/AM|PM/);
    }
    // 20:00 renders as a 24h value in these locales.
    expect(formatHour(20, 'ru')).toContain('20');
    expect(formatHour(20, 'he')).toContain('20');
  });
});
