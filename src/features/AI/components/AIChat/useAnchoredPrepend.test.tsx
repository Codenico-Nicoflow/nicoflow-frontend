import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAnchoredPrepend } from './useAnchoredPrepend';

// jsdom doesn't do layout, so scrollHeight/scrollTop are both 0 by default.
// We define them as writable own properties on the element so the hook can both
// read and set them during the test.
const makeContainer = ({ scrollHeight = 0, scrollTop = 0 } = {}) => {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollHeight', { writable: true, configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'scrollTop', { writable: true, configurable: true, value: scrollTop });
  return el;
};

// createRef() makes `current` non-configurable, so we use a plain mutable object
// that matches the RefObject shape.
const makeRef = <T extends HTMLElement>(el: T): React.RefObject<T | null> => ({ current: el });

describe('useAnchoredPrepend', () => {
  it('does nothing when isPrepending is false and no items change', () => {
    const el = makeContainer({ scrollHeight: 500, scrollTop: 100 });
    const ref = makeRef(el);

    renderHook(() => useAnchoredPrepend({ containerRef: ref, itemsLength: 5, isPrepending: false }));

    expect(el.scrollTop).toBe(100);
  });

  it('adjusts scrollTop by the inserted height when new items land after a prepend', () => {
    const el = makeContainer({ scrollHeight: 500, scrollTop: 100 });
    const ref = makeRef(el);

    const { rerender } = renderHook(
      ({ isPrepending, itemsLength }: { isPrepending: boolean; itemsLength: number }) =>
        useAnchoredPrepend({ containerRef: ref, itemsLength, isPrepending }),
      { initialProps: { isPrepending: false, itemsLength: 5 } }
    );

    // Phase 1: snapshot fires when isPrepending flips to true.
    rerender({ isPrepending: true, itemsLength: 5 });

    // Simulate DOM growth from 10 new messages being prepended.
    (el as unknown as Record<string, number>).scrollHeight = 1000;

    // Phase 2: correction fires when itemsLength grows.
    rerender({ isPrepending: false, itemsLength: 15 });

    // scrollTop should be adjusted by the delta (1000 - 500) + original (100).
    expect(el.scrollTop).toBe(600);
  });

  it('does not apply a correction when scrollHeight did not change', () => {
    const el = makeContainer({ scrollHeight: 500, scrollTop: 200 });
    const ref = makeRef(el);

    const { rerender } = renderHook(
      ({ isPrepending, itemsLength }: { isPrepending: boolean; itemsLength: number }) =>
        useAnchoredPrepend({ containerRef: ref, itemsLength, isPrepending }),
      { initialProps: { isPrepending: false, itemsLength: 5 } }
    );

    rerender({ isPrepending: true, itemsLength: 5 });
    // scrollHeight unchanged — no real DOM growth.
    rerender({ isPrepending: false, itemsLength: 5 });

    expect(el.scrollTop).toBe(200);
  });
});
