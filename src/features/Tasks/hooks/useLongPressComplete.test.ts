import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLongPressComplete } from './useLongPressComplete';

// Helper: build a minimal React.TouchEvent-like object with a single touch point.
const makeTouchEvent = (x = 0, y = 0) =>
  ({
    touches: [{ clientX: x, clientY: y }],
  }) as unknown as React.TouchEvent;

// Simulate touch capability via navigator.maxTouchPoints (works in jsdom).
const enableTouch = () => {
  Object.defineProperty(navigator, 'maxTouchPoints', { value: 1, writable: true, configurable: true });
};
const disableTouch = () => {
  Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true, configurable: true });
};

describe('useLongPressComplete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    enableTouch();
  });

  afterEach(() => {
    vi.useRealTimers();
    disableTouch();
  });

  it('fires onComplete after the full hold duration', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPressComplete({ onComplete, durationMs: 500 }));

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent(100, 100));
    });

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onComplete when touch ends before the duration', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPressComplete({ onComplete, durationMs: 500 }));

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent(0, 0));
    });

    act(() => {
      vi.advanceTimersByTime(300);
      result.current.handlers.onTouchEnd();
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cancels on touchcancel before duration', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPressComplete({ onComplete, durationMs: 500 }));

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent(0, 0));
    });

    act(() => {
      vi.advanceTimersByTime(250);
      result.current.handlers.onTouchCancel();
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cancels when the touch moves beyond the movement threshold (scroll protection)', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPressComplete({ onComplete, durationMs: 500, movementThreshold: 10 }));

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent(100, 100));
    });

    act(() => {
      // Move 15px vertically — beyond the 10px threshold.
      result.current.handlers.onTouchMove(makeTouchEvent(100, 115));
    });

    act(() => {
      vi.advanceTimersByTime(500);
      result.current.handlers.onTouchEnd();
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('does NOT cancel when the touch moves within the movement threshold', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPressComplete({ onComplete, durationMs: 500, movementThreshold: 10 }));

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent(100, 100));
    });

    act(() => {
      // Move 5px — within threshold.
      result.current.handlers.onTouchMove(makeTouchEvent(104, 103));
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire when disabled, even after full hold', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPressComplete({ onComplete, durationMs: 500, disabled: true }));

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent(0, 0));
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('does NOT fire when navigator.maxTouchPoints is 0 (non-touch environment)', () => {
    disableTouch();

    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPressComplete({ onComplete, durationMs: 500 }));

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent(0, 0));
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('tracks isHolding state: true during hold, false after cancel', () => {
    const onComplete = vi.fn();

    const { result } = renderHook(() => useLongPressComplete({ onComplete, durationMs: 500 }));

    expect(result.current.progress).toBe(0);
    expect(result.current.isHolding).toBe(false);

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent(0, 0));
    });

    expect(result.current.isHolding).toBe(true);

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(result.current.isHolding).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('resets to idle after completion fires', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPressComplete({ onComplete, durationMs: 500 }));

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent(0, 0));
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.isHolding).toBe(false);
  });
});
