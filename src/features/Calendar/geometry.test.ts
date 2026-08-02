import { describe, expect, it } from 'vitest';

import { TaskStatus } from '@/lib/types';
import { makeTask } from '@/mocks/handlers';

import { DEFAULT_BLOCK_MINUTES, HOUR_HEIGHT_PX, MIN_BLOCK_HEIGHT_PX } from './data';
import { allDayTasks, blockGeometry, layoutDay, nowOffset, parseMinutes } from './geometry';

describe('parseMinutes', () => {
  it.each([
    ['00:00', 0],
    ['09:00', 540],
    ['09:15', 555],
    ['23:45', 1425],
  ])('parses %s', (input, expected) => {
    expect(parseMinutes(input)).toBe(expected);
  });

  it.each([[null], [undefined], [''], ['9:00'], ['24:00'], ['09:60'], ['nonsense']])(
    'returns null for %s so a bad value falls back to the all-day rail',
    input => {
      expect(parseMinutes(input as string | null | undefined)).toBeNull();
    }
  );
});

describe('blockGeometry', () => {
  it('positions and sizes an estimated block', () => {
    const geometry = blockGeometry(makeTask({ scheduledTime: '09:00', estimatedMinutes: 60 }));
    expect(geometry).toEqual({ top: 9 * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX, isUnestimated: false });
  });

  it('draws an unestimated block at the rendered default and flags it', () => {
    const geometry = blockGeometry(makeTask({ scheduledTime: '09:00', estimatedMinutes: null }));
    expect(geometry?.isUnestimated).toBe(true);
    expect(geometry?.height).toBe((DEFAULT_BLOCK_MINUTES / 60) * HOUR_HEIGHT_PX);
  });

  it('never lets a block run past midnight', () => {
    const geometry = blockGeometry(makeTask({ scheduledTime: '23:30', estimatedMinutes: 120 }));
    expect(geometry!.top + geometry!.height).toBeLessThanOrEqual(24 * HOUR_HEIGHT_PX);
  });

  it('keeps a very short block tappable', () => {
    const geometry = blockGeometry(makeTask({ scheduledTime: '09:00', estimatedMinutes: 1 }));
    expect(geometry?.height).toBe(MIN_BLOCK_HEIGHT_PX);
  });

  it('returns null without a time', () => {
    expect(blockGeometry(makeTask({ scheduledTime: null }))).toBeNull();
  });
});

describe('layoutDay', () => {
  it('gives a lone task the full column', () => {
    const [block] = layoutDay([makeTask({ id: 'a', scheduledTime: '09:00', estimatedMinutes: 60 })]);
    expect(block).toMatchObject({ column: 0, columns: 1 });
  });

  it('splits width between overlapping tasks', () => {
    const layout = layoutDay([
      makeTask({ id: 'a', scheduledTime: '09:00', estimatedMinutes: 60 }),
      makeTask({ id: 'b', scheduledTime: '09:30', estimatedMinutes: 60 }),
    ]);
    expect(layout.map(block => block.column)).toEqual([0, 1]);
    expect(layout.every(block => block.columns === 2)).toBe(true);
  });

  it('keeps sequential tasks full width', () => {
    const layout = layoutDay([
      makeTask({ id: 'a', scheduledTime: '09:00', estimatedMinutes: 60 }),
      makeTask({ id: 'b', scheduledTime: '10:00', estimatedMinutes: 60 }),
    ]);
    expect(layout.every(block => block.columns === 1)).toBe(true);
  });

  it('does not shrink an unrelated later task because an earlier pair overlapped', () => {
    const layout = layoutDay([
      makeTask({ id: 'a', scheduledTime: '09:00', estimatedMinutes: 60 }),
      makeTask({ id: 'b', scheduledTime: '09:30', estimatedMinutes: 60 }),
      makeTask({ id: 'c', scheduledTime: '14:00', estimatedMinutes: 60 }),
    ]);
    expect(layout.find(block => block.task.id === 'c')?.columns).toBe(1);
  });

  it('excludes untimed tasks from the grid', () => {
    const layout = layoutDay([makeTask({ id: 'a', scheduledTime: null })]);
    expect(layout).toHaveLength(0);
  });
});

describe('allDayTasks', () => {
  it('keeps only tasks with no usable time', () => {
    const tasks = [
      makeTask({ id: 'timed', scheduledTime: '09:00' }),
      makeTask({ id: 'untimed', scheduledTime: null }),
      makeTask({ id: 'malformed', scheduledTime: 'nope' }),
    ];
    expect(allDayTasks(tasks).map(task => task.id)).toEqual(['untimed', 'malformed']);
  });

  it('sorts open work ahead of completed so a cap never hides what is left to do', () => {
    const tasks = [
      makeTask({ id: 'done-first', scheduledTime: null, status: TaskStatus.DONE, displayOrder: 0 }),
      makeTask({ id: 'open', scheduledTime: null, displayOrder: 1 }),
      makeTask({ id: 'done-second', scheduledTime: null, status: TaskStatus.DONE, displayOrder: 2 }),
    ];
    expect(allDayTasks(tasks).map(task => task.id)).toEqual(['open', 'done-first', 'done-second']);
  });

  it('keeps displayOrder within each group so the order is stable', () => {
    const tasks = [
      makeTask({ id: 'b', scheduledTime: null, displayOrder: 2 }),
      makeTask({ id: 'a', scheduledTime: null, displayOrder: 1 }),
    ];
    expect(allDayTasks(tasks).map(task => task.id)).toEqual(['a', 'b']);
  });
});

describe('nowOffset', () => {
  it('offsets by the wall-clock time on the matching day', () => {
    const now = new Date(2026, 7, 1, 6, 30);
    expect(nowOffset(now, new Date(2026, 7, 1))).toBe(6.5 * HOUR_HEIGHT_PX);
  });

  it('returns null on any other day so only today draws the line', () => {
    const now = new Date(2026, 7, 1, 6, 30);
    expect(nowOffset(now, new Date(2026, 7, 2))).toBeNull();
  });

  describe('with an account timezone', () => {
    // 22:30 UTC on the 5th is 07:30 on the 6th in Tokyo, 18:30 on the 5th in NY.
    const INSTANT = new Date('2026-08-05T22:30:00Z');

    it('draws the line at the account wall clock, not the browser one', () => {
      expect(nowOffset(INSTANT, new Date(2026, 7, 6), 'Asia/Tokyo')).toBe(7.5 * HOUR_HEIGHT_PX);
      expect(nowOffset(INSTANT, new Date(2026, 7, 5), 'America/New_York')).toBe(18.5 * HOUR_HEIGHT_PX);
    });

    it('matches the account day rather than the browser day', () => {
      // In Tokyo it is already the 6th, so the 5th must not carry the line.
      expect(nowOffset(INSTANT, new Date(2026, 7, 5), 'Asia/Tokyo')).toBeNull();
      expect(nowOffset(INSTANT, new Date(2026, 7, 6), 'America/New_York')).toBeNull();
    });

    it('falls back to browser-local on an unknown zone rather than blanking the line', () => {
      expect(nowOffset(INSTANT, INSTANT, 'Mars/Olympus_Mons')).toBe(
        ((INSTANT.getHours() * 60 + INSTANT.getMinutes()) / 60) * HOUR_HEIGHT_PX
      );
    });
  });
});
