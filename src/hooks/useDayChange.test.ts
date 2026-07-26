import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDayChange } from './useDayChange';

describe('useDayChange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 11:59:50 PM local — 20s short of midnight.
    vi.setSystemTime(new Date(2026, 6, 26, 23, 59, 50));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fires onChange when the midnight timer crosses into a new day', () => {
    const onChange = vi.fn();
    renderHook(() => useDayChange(onChange));

    vi.advanceTimersByTime(21_000); // past 00:00:01

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not fire while the clock stays on the same day', () => {
    const onChange = vi.fn();
    renderHook(() => useDayChange(onChange));

    vi.advanceTimersByTime(5_000); // still 23:59:55

    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires on visibility wake if the day already rolled over (e.g. slept past midnight)', () => {
    const onChange = vi.fn();
    renderHook(() => useDayChange(onChange));

    // Machine wakes the next day; the suspended timer never ran.
    vi.setSystemTime(new Date(2026, 6, 27, 8, 0, 0));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
