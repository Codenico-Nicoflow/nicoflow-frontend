import { addDays, format, subDays } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { TaskEnergy } from '@/lib/types';

import { formatTaskGentleDate, getEnergyGlyph } from '.';

const isoDate = (d: Date) => format(d, 'yyyy-MM-dd');

describe('formatTaskGentleDate', () => {
  it('returns null when the task has no dates', () => {
    expect(formatTaskGentleDate({ scheduledFor: null, dueDate: null })).toBeNull();
  });

  it('a past soft scheduledFor reads as "carried over" — never red', () => {
    const result = formatTaskGentleDate({ scheduledFor: isoDate(subDays(new Date(), 3)), dueDate: null });
    expect(result?.kind).toBe('carriedOver');
    expect(result?.className).not.toMatch(/red/);
  });

  it('a soft scheduledFor today/tomorrow uses the soft (non-red) tone', () => {
    const today = formatTaskGentleDate({ scheduledFor: isoDate(new Date()), dueDate: null });
    const tomorrow = formatTaskGentleDate({ scheduledFor: isoDate(addDays(new Date(), 1)), dueDate: null });
    expect(today?.kind).toBe('scheduledToday');
    expect(tomorrow?.kind).toBe('scheduledTomorrow');
    expect(today?.className).not.toMatch(/red/);
  });

  it('soft scheduledFor takes precedence over a hard dueDate', () => {
    const result = formatTaskGentleDate({
      scheduledFor: isoDate(subDays(new Date(), 1)),
      dueDate: subDays(new Date(), 1).toISOString(),
    });
    expect(result?.kind).toBe('carriedOver');
  });

  it('a hard dueDate today or past surfaces as a calm amber "due" — not red', () => {
    const today = formatTaskGentleDate({ scheduledFor: null, dueDate: new Date().toISOString() });
    const past = formatTaskGentleDate({ scheduledFor: null, dueDate: subDays(new Date(), 5).toISOString() });
    expect(today?.kind).toBe('dueToday');
    expect(past?.kind).toBe('dueToday');
    expect(today?.className).toMatch(/amber/);
    expect(today?.className).not.toMatch(/red/);
    expect(past?.className).not.toMatch(/red/);
  });
});

describe('getEnergyGlyph', () => {
  it('maps each energy level to a distinct glyph + label key', () => {
    expect(getEnergyGlyph(TaskEnergy.LOW).labelKey).toBe('task:energy.low');
    expect(getEnergyGlyph(TaskEnergy.MEDIUM).labelKey).toBe('task:energy.medium');
    expect(getEnergyGlyph(TaskEnergy.DEEP).labelKey).toBe('task:energy.deep');
  });
});
