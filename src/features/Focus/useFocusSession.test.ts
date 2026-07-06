import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import { useFocusSession } from './useFocusSession';

const ranked = [
  makeTask({ id: 'a', title: 'A', displayOrder: 0 }),
  makeTask({ id: 'b', title: 'B', displayOrder: 1 }),
  makeTask({ id: 'c', title: 'C', displayOrder: 2 }),
];

describe('useFocusSession', () => {
  it('starts idle: no current task, full list up next', () => {
    const { result } = renderHook(() => useFocusSession(ranked));
    expect(result.current.current).toBeNull();
    expect(result.current.isActive).toBe(false);
    expect(result.current.upNext.map(t => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('start promotes a task and drops it from up-next', () => {
    const { result } = renderHook(() => useFocusSession(ranked));
    act(() => result.current.start('a'));
    expect(result.current.current?.id).toBe('a');
    expect(result.current.upNext.map(t => t.id)).toEqual(['b', 'c']);
    expect(result.current.isActive).toBe(true);
  });

  it('advance moves to the next up-next task', () => {
    const { result } = renderHook(() => useFocusSession(ranked));
    act(() => result.current.start('a'));
    act(() => result.current.advance());
    expect(result.current.current?.id).toBe('b');
  });

  it('skip sends the current task to the bottom for the session and advances', () => {
    const { result } = renderHook(() => useFocusSession(ranked));
    act(() => result.current.start('a'));
    act(() => result.current.skip());
    expect(result.current.current?.id).toBe('b');
    // 'a' isn't lost — it drops below the un-skipped tasks.
    expect(result.current.upNext.map(t => t.id)).toEqual(['c', 'a']);
  });

  it('advancing past the last task ends the session (current null)', () => {
    const { result } = renderHook(() => useFocusSession(ranked.slice(0, 1)));
    act(() => result.current.start('a'));
    act(() => result.current.advance());
    expect(result.current.current).toBeNull();
  });
});
