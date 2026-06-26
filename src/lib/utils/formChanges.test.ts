import { describe, expect, it } from 'vitest';

import { detectFormChanges, hasFormChanges } from '@/lib/utils';

// Models the edit-form mismatch: the entity stores dates as ISO strings while
// the form holds Date objects, and empty as null vs ''.
interface Entity {
  name: string;
  dueDate: string | null;
  description: string | null;
}

describe('detectFormChanges', () => {
  const original: Entity = { name: 'Redesign', dueDate: '2026-06-30T00:00:00.000Z', description: null };

  it('treats an equal date as unchanged across Date vs ISO-string shapes', () => {
    const current = { name: 'Redesign', dueDate: new Date('2026-06-30T00:00:00.000Z'), description: '' };
    expect(detectFormChanges(original, current as never)).toBe(false);
  });

  it('treats null vs empty-string as unchanged (cleared field)', () => {
    const current = { name: 'Redesign', dueDate: original.dueDate, description: '' };
    expect(detectFormChanges(original, current)).toBe(false);
  });

  it('detects a real date change', () => {
    const current = { name: 'Redesign', dueDate: new Date('2026-07-01T00:00:00.000Z'), description: '' };
    expect(detectFormChanges(original, current as never)).toBe(true);
  });

  it('detects a real text change', () => {
    const current = { name: 'Renamed', dueDate: original.dueDate, description: null };
    expect(detectFormChanges(original, current)).toBe(true);
  });
});

describe('hasFormChanges', () => {
  const original: Entity = { name: 'Redesign', dueDate: '2026-06-30T00:00:00.000Z', description: null };

  it('always returns true in create mode', () => {
    expect(hasFormChanges(false, original, {})).toBe(true);
  });

  it('returns false when an edited form matches the original (different shapes)', () => {
    const current = { name: 'Redesign', dueDate: new Date('2026-06-30T00:00:00.000Z'), description: '' };
    expect(hasFormChanges(true, original, current as never)).toBe(false);
  });
});
