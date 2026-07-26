import { describe, expect, it } from 'vitest';

import { formatDuration } from './presets';

describe('formatDuration', () => {
  it('shows sub-hour values in minutes', () => {
    expect(formatDuration(45, 'min', 'h')).toBe('45min');
  });

  it('shows whole hours without minutes', () => {
    expect(formatDuration(120, 'min', 'h')).toBe('2h');
  });

  it('shows mixed hours and minutes', () => {
    expect(formatDuration(90, 'min', 'h')).toBe('1h 30min');
  });
});
