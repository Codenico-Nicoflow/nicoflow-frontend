import { useLayoutEffect, useRef } from 'react';

export type AnchoredPrependArgs<T extends HTMLElement> = {
  containerRef: React.RefObject<T | null>;
  itemsLength: number;
  isPrepending: boolean;
};

// Preserves the user's scroll position when older messages are inserted above.
// Works in two layout effects — one snapshots scroll geometry when the fetch
// starts, the other applies the correction when new items land — both must be
// useLayoutEffect so the adjustment happens before paint, preventing a visible
// jump.
//
// Coexists with useAutoScroll on the same container because useAutoScroll's
// scrollToBottom is a no-op when the user is unpinned (has scrolled up), which
// is precisely the condition that triggers history loading.
export const useAnchoredPrepend = <T extends HTMLElement>({
  containerRef,
  itemsLength,
  isPrepending,
}: AnchoredPrependArgs<T>): void => {
  const snapshot = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);

  // Phase 1: snapshot scroll geometry the moment a prepend fetch starts.
  useLayoutEffect(() => {
    if (!isPrepending) return;
    const el = containerRef.current;
    if (!el) return;
    snapshot.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
  }, [isPrepending, containerRef]);

  // Phase 2: when itemsLength grows and a snapshot exists, adjust scrollTop so
  // the previously visible content stays at the same visual position.
  useLayoutEffect(() => {
    if (!snapshot.current) return;
    const el = containerRef.current;
    if (!el) return;
    const { scrollHeight: prevHeight, scrollTop: prevTop } = snapshot.current;
    const newHeight = el.scrollHeight;
    if (newHeight === prevHeight) return;
    el.scrollTop = newHeight - prevHeight + prevTop;
    snapshot.current = null;
  }, [itemsLength, containerRef]);
};
