import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useInfiniteScrollSentinel } from './useInfiniteScrollSentinel';

// Controllable IntersectionObserver that lets tests manually fire the callback.
type IOCallback = (entries: IntersectionObserverEntry[]) => void;

const makeEntry = (isIntersecting: boolean) => ({ isIntersecting }) as IntersectionObserverEntry;

let lastCallback: IOCallback | null = null;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

class FakeIntersectionObserver {
  constructor(cb: IOCallback) {
    lastCallback = cb;
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = mockUnobserve;
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  lastCallback = null;
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  mockUnobserve.mockClear();
});

describe('useInfiniteScrollSentinel', () => {
  it('calls onLoadMore when the sentinel intersects and hasMore is true', () => {
    const onLoadMore = vi.fn();
    const { result } = renderHook(() => useInfiniteScrollSentinel({ hasMore: true, isLoadingMore: false, onLoadMore }));

    const el = document.createElement('div');
    result.current.sentinelRef(el);

    lastCallback!([makeEntry(true)]);

    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('does not call onLoadMore when hasMore is false', () => {
    const onLoadMore = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScrollSentinel({ hasMore: false, isLoadingMore: false, onLoadMore })
    );

    const el = document.createElement('div');
    result.current.sentinelRef(el);
    lastCallback!([makeEntry(true)]);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not call onLoadMore when isLoadingMore is true (guards against repeated fetches)', () => {
    const onLoadMore = vi.fn();
    const { result } = renderHook(() => useInfiniteScrollSentinel({ hasMore: true, isLoadingMore: true, onLoadMore }));

    const el = document.createElement('div');
    result.current.sentinelRef(el);
    lastCallback!([makeEntry(true)]);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not call onLoadMore when the entry is not intersecting', () => {
    const onLoadMore = vi.fn();
    const { result } = renderHook(() => useInfiniteScrollSentinel({ hasMore: true, isLoadingMore: false, onLoadMore }));

    const el = document.createElement('div');
    result.current.sentinelRef(el);
    lastCallback!([makeEntry(false)]);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('disconnects the observer when the ref is set to null (sentinel unmounts)', () => {
    const onLoadMore = vi.fn();
    const { result } = renderHook(() => useInfiniteScrollSentinel({ hasMore: true, isLoadingMore: false, onLoadMore }));

    const el = document.createElement('div');
    result.current.sentinelRef(el);
    expect(mockObserve).toHaveBeenCalledWith(el);

    result.current.sentinelRef(null);
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it('disconnects the old observer and attaches a new one when the sentinel element changes', () => {
    const onLoadMore = vi.fn();
    const { result } = renderHook(() => useInfiniteScrollSentinel({ hasMore: true, isLoadingMore: false, onLoadMore }));

    const el1 = document.createElement('div');
    result.current.sentinelRef(el1);
    expect(mockObserve).toHaveBeenCalledWith(el1);

    const el2 = document.createElement('div');
    result.current.sentinelRef(el2);
    expect(mockDisconnect).toHaveBeenCalledOnce();
    expect(mockObserve).toHaveBeenCalledWith(el2);
  });
});
