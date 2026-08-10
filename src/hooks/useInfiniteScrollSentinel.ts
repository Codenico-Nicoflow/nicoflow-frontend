import { useCallback, useRef } from 'react';

export type InfiniteScrollSentinelArgs = {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  root?: React.RefObject<HTMLElement | null>;
  rootMargin?: string;
};

export type InfiniteScrollSentinel = {
  sentinelRef: (node: HTMLElement | null) => void;
};

// A ref callback is used (not useRef + useEffect) so the observer re-attaches
// correctly when the sentinel element unmounts then remounts — e.g. when the
// empty-state transitions to a populated list.
export const useInfiniteScrollSentinel = ({
  hasMore,
  isLoadingMore,
  onLoadMore,
  root,
  rootMargin = '200px',
}: InfiniteScrollSentinelArgs): InfiniteScrollSentinel => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
            onLoadMore();
          }
        },
        {
          root: root?.current ?? null,
          rootMargin,
        }
      );
      observerRef.current.observe(node);
    },
    // Re-create the callback when guard conditions change so the closure stays fresh.

    [hasMore, isLoadingMore, onLoadMore, root, rootMargin]
  );

  return { sentinelRef };
};
