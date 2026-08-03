import { describe, expect, it } from 'vitest';

import { type IGoogleCalendar, MAX_SELECTED_CALENDARS } from '@/lib/store';

import { isAtCap, isDisabledByCap, selectedIds, toggleCalendar } from './calendarSelection';

const calendar = (id: string, selected: boolean): IGoogleCalendar => ({
  id,
  summary: id,
  backgroundColor: '#4285f4',
  primary: id === 'primary',
  selected,
});

/** A list with `count` selected calendars, plus one unselected. */
const listWith = (count: number): IGoogleCalendar[] => [
  ...Array.from({ length: count }, (_, i) => calendar(`c${i}`, true)),
  calendar('extra', false),
];

describe('selectedIds', () => {
  it('returns only the selected calendars, in list order', () => {
    const list = [calendar('a', true), calendar('b', false), calendar('c', true)];
    expect(selectedIds(list)).toEqual(['a', 'c']);
  });

  it('returns an empty array when nothing is selected', () => {
    expect(selectedIds([calendar('a', false)])).toEqual([]);
  });
});

describe('isAtCap', () => {
  it('is false below the cap', () => {
    expect(isAtCap(['a', 'b'])).toBe(false);
  });

  it('is true exactly at the cap', () => {
    expect(isAtCap(Array.from({ length: MAX_SELECTED_CALENDARS }, (_, i) => `c${i}`))).toBe(true);
  });

  // A selection that somehow exceeded the cap must still read as full rather
  // than silently allowing more.
  it('is true above the cap', () => {
    expect(isAtCap(Array.from({ length: MAX_SELECTED_CALENDARS + 3 }, (_, i) => `c${i}`))).toBe(true);
  });
});

describe('isDisabledByCap', () => {
  it('locks an unselected calendar once the cap is reached', () => {
    const list = listWith(MAX_SELECTED_CALENDARS);
    const extra = list.find(c => c.id === 'extra');
    expect(isDisabledByCap(extra!, selectedIds(list))).toBe(true);
  });

  // Un-checking must always stay available, or a user at the cap is trapped
  // with no way back under it.
  it('never locks an already-selected calendar', () => {
    const list = listWith(MAX_SELECTED_CALENDARS);
    for (const selectedCalendar of list.filter(c => c.selected)) {
      expect(isDisabledByCap(selectedCalendar, selectedIds(list))).toBe(false);
    }
  });

  it('does not lock anything below the cap', () => {
    const list = listWith(MAX_SELECTED_CALENDARS - 1);
    const extra = list.find(c => c.id === 'extra');
    expect(isDisabledByCap(extra!, selectedIds(list))).toBe(false);
  });
});

describe('toggleCalendar', () => {
  it('adds an unselected calendar', () => {
    const list = [calendar('a', true), calendar('b', false)];
    expect(toggleCalendar(list, 'b')).toEqual(['a', 'b']);
  });

  it('removes a selected calendar', () => {
    const list = [calendar('a', true), calendar('b', true)];
    expect(toggleCalendar(list, 'a')).toEqual(['b']);
  });

  // Even a caller that ignores isDisabledByCap must not be able to build an
  // over-cap request.
  it('refuses to exceed the cap', () => {
    const list = listWith(MAX_SELECTED_CALENDARS);
    const before = selectedIds(list);
    expect(toggleCalendar(list, 'extra')).toEqual(before);
  });

  // De-selecting at the cap is the escape hatch and must always work.
  it('allows removal while at the cap', () => {
    const list = listWith(MAX_SELECTED_CALENDARS);
    const next = toggleCalendar(list, 'c0');
    expect(next).toHaveLength(MAX_SELECTED_CALENDARS - 1);
    expect(next).not.toContain('c0');
  });

  it('allows reaching exactly the cap', () => {
    const list = listWith(MAX_SELECTED_CALENDARS - 1);
    expect(toggleCalendar(list, 'extra')).toHaveLength(MAX_SELECTED_CALENDARS);
  });
});
