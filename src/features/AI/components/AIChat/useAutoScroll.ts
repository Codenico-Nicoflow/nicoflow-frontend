import { useCallback, useEffect, useRef, useState } from 'react';

// Distance from the bottom (px) within which the view counts as "pinned". A small
// slack absorbs sub-pixel rounding and the growth of the last streaming line.
const PIN_THRESHOLD = 48;

export interface AutoScroll<T extends HTMLElement> {
  // Attach to the scroll container.
  ref: React.RefObject<T | null>;
  // True while the user is at (or near) the bottom — the thread auto-follows.
  pinned: boolean;
  // Call after content changes (e.g. each delta) to follow when pinned.
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  // Wire to the "jump to latest" button — re-pins and scrolls down.
  onScroll: () => void;
}

// useAutoScroll implements the chat pin/unpin pattern: while the user sits at the
// bottom the thread follows new content; the moment they scroll up it stops
// following and `pinned` flips false so the caller can show a jump-to-latest
// button. Scrolling back down (manually or via jumpToLatest) re-pins.
export const useAutoScroll = <T extends HTMLElement>(): AutoScroll<T> & { jumpToLatest: () => void } => {
  const ref = useRef<T>(null);
  const [pinned, setPinned] = useState(true);
  // Mirror of `pinned` for scrollToBottom, which must read the latest value
  // without being re-created every time pinned flips (it's called in an effect).
  const pinnedRef = useRef(true);

  const setPin = useCallback((next: boolean) => {
    pinnedRef.current = next;
    setPinned(next);
  }, []);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setPin(distance <= PIN_THRESHOLD);
  }, [setPin]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = ref.current;
    if (!el || !pinnedRef.current || typeof el.scrollTo !== 'function') return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const jumpToLatest = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setPin(true);
    if (typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [setPin]);

  // Keep the listener attached to the live element across renders.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return { ref, pinned, scrollToBottom, onScroll, jumpToLatest };
};
