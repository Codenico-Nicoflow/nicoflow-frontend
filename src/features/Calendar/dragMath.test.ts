import { describe, expect, it } from 'vitest';

import { HOUR_HEIGHT_PX, MINUTES_PER_DAY, SNAP_MINUTES } from './data';
import { deltaToMinutes, movedStartMinutes, resizedMinutes, snapMinutes, toTimeString } from './dragMath';

describe('snapMinutes', () => {
  it.each([
    [0, 0],
    [7, 0],
    [8, 15],
    [22, 15],
    [23, 30],
    [540, 540],
  ])('snaps %i to %i', (input, expected) => {
    expect(snapMinutes(input)).toBe(expected);
  });

  it('never returns a value off the 15-minute boundary', () => {
    for (let minute = 0; minute <= MINUTES_PER_DAY; minute += 1) {
      expect(snapMinutes(minute) % SNAP_MINUTES).toBe(0);
    }
  });
});

describe('deltaToMinutes', () => {
  it('converts a full hour of travel', () => {
    expect(deltaToMinutes(HOUR_HEIGHT_PX)).toBe(60);
  });

  it('converts upward travel to negative minutes', () => {
    expect(deltaToMinutes(-HOUR_HEIGHT_PX)).toBe(-60);
  });

  it('ignores travel smaller than half a snap step', () => {
    expect(deltaToMinutes(1)).toBe(0);
  });
});

describe('toTimeString', () => {
  it.each([
    [0, '00:00'],
    [540, '09:00'],
    [555, '09:15'],
    [1425, '23:45'],
  ])('formats %i as %s', (input, expected) => {
    expect(toTimeString(input)).toBe(expected);
  });
});

describe('movedStartMinutes', () => {
  it('moves a block down by the dragged distance', () => {
    // 09:00 dragged two hours down.
    expect(movedStartMinutes(540, HOUR_HEIGHT_PX * 2)).toBe(660);
  });

  it('snaps an in-between drop to the nearest quarter hour', () => {
    // 09:00 dragged ~7 minutes: below the half-step, so it holds at 09:00.
    const sevenMinutes = (7 / 60) * HOUR_HEIGHT_PX;
    expect(toTimeString(movedStartMinutes(540, sevenMinutes))).toBe('09:00');
    // ~8 minutes crosses the half-step and lands on 09:15, never 09:07.
    const eightMinutes = (8 / 60) * HOUR_HEIGHT_PX;
    expect(toTimeString(movedStartMinutes(540, eightMinutes))).toBe('09:15');
  });

  it('clamps a block dragged above the day to midnight', () => {
    expect(movedStartMinutes(60, -HOUR_HEIGHT_PX * 5)).toBe(0);
  });

  it('never lets a block cross midnight', () => {
    expect(movedStartMinutes(1380, HOUR_HEIGHT_PX * 5)).toBe(MINUTES_PER_DAY - SNAP_MINUTES);
  });
});

describe('resizedMinutes', () => {
  it('grows a block by the dragged distance', () => {
    expect(resizedMinutes(540, 60, HOUR_HEIGHT_PX)).toBe(120);
  });

  it('shrinks a block by upward travel', () => {
    expect(resizedMinutes(540, 60, -HOUR_HEIGHT_PX / 2)).toBe(30);
  });

  it('floors at one snap step so a block can never vanish', () => {
    expect(resizedMinutes(540, 60, -HOUR_HEIGHT_PX * 4)).toBe(SNAP_MINUTES);
  });

  it('caps growth at the end of the day', () => {
    // 23:00 start leaves 60 minutes, however far the edge is dragged.
    expect(resizedMinutes(1380, 30, HOUR_HEIGHT_PX * 6)).toBe(60);
  });
});
