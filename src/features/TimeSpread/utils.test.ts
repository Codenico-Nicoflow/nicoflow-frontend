import { describe, expect, it } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import { groupByDay } from './utils';

// Fixed reference day so grouping isn't clock-dependent.
const TODAY = new Date('2026-07-06T09:00:00');
const iso = (offset: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

describe('groupByDay', () => {
  it('groups tasks by calendar day across the next 7 days', () => {
    const tasks = [
      makeTask({ id: 'a', scheduledFor: iso(0) }),
      makeTask({ id: 'b', scheduledFor: iso(0) }),
      makeTask({ id: 'c', scheduledFor: iso(2) }),
    ];

    const groups = groupByDay(tasks, TODAY);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.tasks.map(t => t.id)).toEqual(['a', 'b']);
    expect(groups[1]?.tasks.map(t => t.id)).toEqual(['c']);
  });

  it('collapses empty days (only days with tasks appear)', () => {
    const groups = groupByDay([makeTask({ id: 'x', scheduledFor: iso(5) })], TODAY);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe(iso(5));
  });

  it('ignores unscheduled tasks and days beyond the 7-day window', () => {
    const groups = groupByDay(
      [makeTask({ id: 'none', scheduledFor: null }), makeTask({ id: 'far', scheduledFor: iso(9) })],
      TODAY
    );
    expect(groups).toHaveLength(0);
  });
});
