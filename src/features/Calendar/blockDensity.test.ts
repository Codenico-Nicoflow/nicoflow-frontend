import { describe, expect, it } from 'vitest';

import { blockDensity } from './blockDensity';

describe('blockDensity', () => {
  it('shows both lines when the box has room', () => {
    expect(blockDensity(96)).toEqual({ showMeta: true, showTitle: true });
  });

  // The reported bug: a 15-minute task floored to a 30-minute box at 96px/hour
  // is 48px — enough for both lines. At 48px/hour the same task is 24px and the
  // meta line was rendered anyway, clipping "08:00 · 15 min" mid-glyph.
  it('drops the meta line when only one line fits', () => {
    expect(blockDensity(24)).toEqual({ showMeta: false, showTitle: true });
  });

  it('drops everything when no text fits', () => {
    expect(blockDensity(12)).toEqual({ showMeta: false, showTitle: false });
  });

  it.each([
    [44, true],
    [43, false],
  ])('treats %ipx as showMeta=%s', (height, expected) => {
    expect(blockDensity(height).showMeta).toBe(expected);
  });

  it.each([
    [22, true],
    [21, false],
  ])('treats %ipx as showTitle=%s', (height, expected) => {
    expect(blockDensity(height).showTitle).toBe(expected);
  });

  // The threshold is about the TEXT, so it must not move with the row height —
  // scaling it is what let a chip claim room it did not have.
  it('is an absolute pixel test, independent of row height', () => {
    expect(blockDensity(40).showMeta).toBe(false);
    expect(blockDensity(48).showMeta).toBe(true);
  });
});
