import { describe, expect, it } from 'vitest';

import { isActive, NAV_DESTINATIONS, OVERFLOW_DESTINATIONS, PRIMARY_DESTINATIONS } from './data';

// Adding Habits must not disturb the phone bar. The four primary cells are the
// whole reason `primary` exists, and quietly demoting one to make room would
// change navigation for every existing user.
describe('habits navigation', () => {
  it('registers Habits as a destination', () => {
    expect(NAV_DESTINATIONS.map(d => d.id)).toContain('habits');
  });

  it('places Habits in the overflow sheet, not the phone bar', () => {
    expect(OVERFLOW_DESTINATIONS.map(d => d.id)).toContain('habits');
    expect(PRIMARY_DESTINATIONS.map(d => d.id)).not.toContain('habits');
  });

  it('leaves the four primary destinations untouched', () => {
    expect(PRIMARY_DESTINATIONS.map(d => d.id)).toEqual(['inbox', 'today', 'areas', 'calendar']);
  });

  it('keeps Habits free — no plan gate on the destination', () => {
    const habits = NAV_DESTINATIONS.find(d => d.id === 'habits');
    expect(habits?.proOnly).toBeUndefined();
  });

  it('marks /habits active only on its own route', () => {
    const habits = NAV_DESTINATIONS.find(d => d.id === 'habits');
    if (!habits) throw new Error('habits destination missing');

    expect(isActive('/habits', habits)).toBe(true);
    expect(isActive('/habits/abc', habits)).toBe(true);
    expect(isActive('/quick-access/today', habits)).toBe(false);
  });
});
