import * as React from 'react';

export interface LongPressCompleteOptions {
  /** Called when the long-press threshold elapses and the gesture was not cancelled. */
  onComplete: () => void;
  /** Duration in ms before completion fires. Default: 500. */
  durationMs?: number;
  /** Touch movement threshold in px beyond which the gesture is treated as a scroll. Default: 10. */
  movementThreshold?: number;
  disabled?: boolean;
}

export interface LongPressCompleteResult {
  /** Attach these to the element that should receive long-press. */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchCancel: () => void;
  };
  /** 0–1 progress while the gesture is in flight; 0 otherwise. */
  progress: number;
  /** True while the finger is held and within the movement threshold. */
  isHolding: boolean;
}

const DURATION_MS = 500;
const MOVEMENT_THRESHOLD_PX = 10;

/** Returns true only on actual touch-capable devices at the time of the gesture. */
const isTouchDevice = () => navigator.maxTouchPoints > 0;

/**
 * Touch-only long-press gesture that fires `onComplete` after `durationMs`.
 * Cancels cleanly on touchend/touchcancel or when the finger moves beyond the
 * movement threshold (so vertical scrolling is never hijacked).
 *
 * Desktop (non-touch) events are intentionally ignored — the handlers check
 * touch capability at the moment of gesture start, not at render time.
 */
export const useLongPressComplete = ({
  onComplete,
  durationMs = DURATION_MS,
  movementThreshold = MOVEMENT_THRESHOLD_PX,
  disabled = false,
}: LongPressCompleteOptions): LongPressCompleteResult => {
  const [progress, setProgress] = React.useState(0);
  const [isHolding, setIsHolding] = React.useState(false);

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const startXRef = React.useRef<number>(0);
  const startYRef = React.useRef<number>(0);
  const onCompleteRef = React.useRef(onComplete);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const cancel = React.useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsHolding(false);
    setProgress(0);
  }, []);

  const tickProgress = React.useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    setProgress(Math.min(elapsed / DURATION_MS, 1));
    rafRef.current = requestAnimationFrame(tickProgress);
  }, []);

  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      if (!isTouchDevice()) return;

      const touch = e.touches[0];
      if (!touch) return;

      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      startTimeRef.current = Date.now();

      setIsHolding(true);
      setProgress(0);

      rafRef.current = requestAnimationFrame(tickProgress);

      timerRef.current = setTimeout(() => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setProgress(1);
        setIsHolding(false);
        onCompleteRef.current();
        // Brief pause so the ring reaches 100% before it hides.
        setTimeout(() => setProgress(0), 120);
      }, durationMs);
    },
    [disabled, durationMs, tickProgress]
  );

  const handleTouchMove = React.useCallback(
    (e: React.TouchEvent) => {
      if (timerRef.current === null) return;

      const touch = e.touches[0];
      if (!touch) return;

      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;

      if (Math.sqrt(dx * dx + dy * dy) > movementThreshold) {
        cancel();
      }
    },
    [cancel, movementThreshold]
  );

  const handleTouchEnd = React.useCallback(() => {
    cancel();
  }, [cancel]);

  const handleTouchCancel = React.useCallback(() => {
    cancel();
  }, [cancel]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onTouchCancel: handleTouchCancel,
    },
    progress,
    isHolding,
  };
};
