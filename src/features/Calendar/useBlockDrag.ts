import { useCallback, useEffect, useRef, useState } from 'react';

import { DRAG_THRESHOLD_PX, HOUR_HEIGHT_PX, LONG_PRESS_MS } from './data';
import { movedStartMinutes, resizedMinutes } from './dragMath';

export type DragMode = 'move' | 'resize';

/** The live gesture, in the units the grid draws with. */
export interface DragState {
  mode: DragMode;
  /** Snapped start minute under the pointer right now. */
  startMinutes: number;
  /** Snapped duration under the pointer right now. */
  minutes: number;
}

export interface BlockDragCommit {
  mode: DragMode;
  startMinutes: number;
  minutes: number;
}

interface UseBlockDragOptions {
  /**
   * Row height the grid actually drew. Screen pixels are converted to minutes
   * against this, so a gesture on a taller row lands where the user dropped it
   * rather than at the base 48px/hour scale.
   */
  hourHeight?: number;
  /** Stored start minute of the block being dragged. */
  startMinutes: number;
  /** Drawn duration — the resize baseline, including the rendered default. */
  minutes: number;
  /** Fired once on release, only when the gesture actually changed something. */
  onCommit: (commit: BlockDragCommit) => void;
  /** Suppresses the click that would otherwise open the dialog after a drag. */
  onDragEnd?: () => void;
  disabled?: boolean;
}

interface Gesture {
  pointerId: number;
  mode: DragMode;
  originY: number;
  /** Touch waits for the long press; mouse arms on the movement threshold. */
  armed: boolean;
}

/**
 * Pointer-driven move/resize for one calendar block.
 *
 * Deliberately native Pointer Events rather than dnd-kit: this is a continuous
 * pixel-to-time mapping with no discrete drop targets, and keeping the maths in
 * pure functions (`dragMath`) is what makes the snapping testable without a DOM.
 *
 * Pointer capture means the gesture survives the pointer leaving the block —
 * without it, dragging faster than React re-renders would drop the drag
 * mid-flight and strand the block at a half-moved position.
 */
export const useBlockDrag = ({
  startMinutes,
  minutes,
  onCommit,
  onDragEnd,
  disabled,
  hourHeight = HOUR_HEIGHT_PX,
}: UseBlockDragOptions) => {
  const [drag, setDrag] = useState<DragState | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read at release time, so the commit uses the last rendered position rather
  // than a stale closure over the state at pointerdown.
  const latest = useRef<DragState | null>(null);

  const clearLongPress = () => {
    if (longPress.current !== null) {
      clearTimeout(longPress.current);
      longPress.current = null;
    }
  };

  const reset = useCallback(() => {
    gesture.current = null;
    latest.current = null;
    clearLongPress();
    setDrag(null);
  }, []);

  // A gesture in flight must not outlive the component (e.g. a WS refresh
  // unmounts the block mid-drag), or the timer fires against a dead node.
  useEffect(() => clearLongPress, []);

  const apply = useCallback(
    (mode: DragMode, deltaY: number) => {
      const next: DragState =
        mode === 'move'
          ? { mode, startMinutes: movedStartMinutes(startMinutes, deltaY, hourHeight), minutes }
          : { mode, startMinutes, minutes: resizedMinutes(startMinutes, minutes, deltaY, hourHeight) };
      latest.current = next;
      setDrag(next);
    },
    // hourHeight belongs here: it changes when the visible-hours window does,
    // and a stale value would convert pointer pixels at the previous scale —
    // landing the gesture at a time the user did not drop it on.
    [minutes, startMinutes, hourHeight]
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent, mode: DragMode) => {
      // Primary button only; a right-click must not start a drag.
      if (disabled || event.button !== 0) return;
      if (mode === 'resize') event.stopPropagation();

      event.currentTarget.setPointerCapture(event.pointerId);
      gesture.current = { pointerId: event.pointerId, mode, originY: event.clientY, armed: false };

      // Touch lifts on a long press so a vertical swipe still scrolls the grid;
      // mouse and pen arm on movement, where there is no scroll to compete with.
      if (event.pointerType === 'touch') {
        longPress.current = setTimeout(() => {
          if (!gesture.current) return;
          gesture.current.armed = true;
          apply(mode, 0);
        }, LONG_PRESS_MS);
      }
    },
    [apply, disabled]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const active = gesture.current;
      if (!active || active.pointerId !== event.pointerId) return;

      const deltaY = event.clientY - active.originY;

      if (!active.armed) {
        // Movement before the long press fires is a scroll, not a drag.
        if (event.pointerType === 'touch') {
          if (Math.abs(deltaY) > DRAG_THRESHOLD_PX) reset();
          return;
        }
        if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) return;
        active.armed = true;
      }

      // Once armed the block owns the gesture — stop the grid scrolling under it.
      event.preventDefault();
      apply(active.mode, deltaY);
    },
    [apply, reset]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const active = gesture.current;
      if (!active || active.pointerId !== event.pointerId) return;

      const committed = latest.current;
      const wasArmed = active.armed;
      reset();

      if (!wasArmed || !committed) return;
      // A gesture that lands back where it started is a no-op, not a mutation:
      // firing it would spend a request and flash a toast for nothing.
      if (committed.startMinutes === startMinutes && committed.minutes === minutes) {
        onDragEnd?.();
        return;
      }

      onCommit({ mode: committed.mode, startMinutes: committed.startMinutes, minutes: committed.minutes });
      onDragEnd?.();
    },
    [minutes, onCommit, onDragEnd, reset, startMinutes]
  );

  return {
    drag,
    isDragging: drag !== null,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: reset },
  };
};
