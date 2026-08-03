import { describe, expect, it } from 'vitest';

import type { IGoogleCalendar } from '@/lib/store';

import { calendarColor, chipStyle, withAlpha } from './googleColor';

const calendar = (id: string, backgroundColor: string): IGoogleCalendar => ({
  id,
  summary: id,
  backgroundColor,
  primary: false,
  selected: true,
});

describe('calendarColor', () => {
  it('uses the colour Google reports so hues match Google Calendar', () => {
    expect(calendarColor('work', [calendar('work', '#0b8043')])).toBe('#0b8043');
  });

  it('falls back to a palette hue for a calendar that is not in the list', () => {
    // Unshared, deleted, or the picker query has not settled yet.
    expect(calendarColor('gone', [])).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('keeps the fallback stable for the same id', () => {
    expect(calendarColor('gone', [])).toBe(calendarColor('gone', []));
  });

  it('gives different ids different fallback hues', () => {
    const hues = new Set(['a', 'b', 'c', 'd'].map(id => calendarColor(id, [])));
    expect(hues.size).toBeGreaterThan(1);
  });

  // A malformed value injected into a style attribute would break the rule
  // silently — or worse, carry a payload.
  it.each(['red', '#fff', 'blue;background:url(x)', ''])('rejects the unusable value %j', value => {
    expect(calendarColor('work', [calendar('work', value)])).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('withAlpha', () => {
  it('converts a hex to rgba at the given alpha', () => {
    expect(withAlpha('#0b8043', 0.1)).toBe('rgba(11, 128, 67, 0.1)');
  });
});

describe('chipStyle', () => {
  it('saturates only the leading edge, keeping the fill faint behind tasks', () => {
    const style = chipStyle('#0b8043');

    expect(style.borderInlineStartColor).toBe('#0b8043');
    expect(style.backgroundColor).toBe('rgba(11, 128, 67, 0.1)');
  });
});
