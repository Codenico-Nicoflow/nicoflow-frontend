import { TaskEnergy } from '@nicoflow/shared/types';
import { addDays, format, subDays } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { formatTaskGentleDate, getEnergyGlyph } from '.';

const isoDate = (d: Date) => format(d, 'yyyy-MM-dd');

describe('formatTaskGentleDate', () => {
  it('returns null when the task is unscheduled', () => {
    expect(formatTaskGentleDate({ scheduledFor: null, rollsOver: true })).toBeNull();
  });

  it('a past soft scheduledFor that rolls over reads as "carried over" — never red', () => {
    const result = formatTaskGentleDate({ scheduledFor: isoDate(subDays(new Date(), 3)), rollsOver: true });
    expect(result?.kind).toBe('carriedOver');
    expect(result?.className).not.toMatch(/red/);
  });

  it('a past scheduledFor with rollsOver=false shows the plain date, not "carried over"', () => {
    const result = formatTaskGentleDate({ scheduledFor: isoDate(subDays(new Date(), 3)), rollsOver: false });
    expect(result?.kind).toBe('passedNotRolling');
    expect(result?.className).not.toMatch(/red/);
  });

  it('a soft scheduledFor today/tomorrow uses the soft (non-red) tone', () => {
    const today = formatTaskGentleDate({ scheduledFor: isoDate(new Date()), rollsOver: true });
    const tomorrow = formatTaskGentleDate({ scheduledFor: isoDate(addDays(new Date(), 1)), rollsOver: true });
    expect(today?.kind).toBe('scheduledToday');
    expect(tomorrow?.kind).toBe('scheduledTomorrow');
    expect(today?.className).not.toMatch(/red/);
  });

  it('a future soft scheduledFor formats the date, neutral tone', () => {
    const result = formatTaskGentleDate({ scheduledFor: isoDate(addDays(new Date(), 5)), rollsOver: true });
    expect(result?.kind).toBe('scheduledFuture');
    expect(result?.className).not.toMatch(/red/);
  });
});

describe('getEnergyGlyph', () => {
  it('maps each energy level to a distinct glyph + label key', () => {
    expect(getEnergyGlyph(TaskEnergy.LOW).labelKey).toBe('task:energy.low');
    expect(getEnergyGlyph(TaskEnergy.MEDIUM).labelKey).toBe('task:energy.medium');
    expect(getEnergyGlyph(TaskEnergy.DEEP).labelKey).toBe('task:energy.deep');
  });
});
