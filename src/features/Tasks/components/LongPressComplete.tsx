import * as React from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { useLongPressComplete } from '../hooks/useLongPressComplete';

interface LongPressCompleteProps {
  /** Fired when the 500ms hold completes. Must already route through the subtask gate. */
  onComplete: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

const RING_SIZE = 36;
const STROKE_WIDTH = 3;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Wraps a task row and adds a touch-only long-press-to-complete gesture.
 * A circular progress ring grows over the hold duration; releasing early cancels.
 * Desktop (pointer: mouse) environments are unaffected.
 */
const LongPressComplete = ({
  onComplete,
  disabled = false,
  children,
  className,
  'data-testid': testId,
}: LongPressCompleteProps) => {
  const reducedMotion = useReducedMotion();
  const { handlers, progress, isHolding } = useLongPressComplete({ onComplete, disabled });

  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const showRing = isHolding || progress > 0;

  return (
    <div className={className} data-testid={testId} {...handlers}>
      {children}

      {/* Progress ring — touch only, hidden at rest */}
      <AnimatePresence>
        {showRing && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.12 }}
          >
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className="rotate-[-90deg]"
            >
              {/* Track */}
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE_WIDTH}
                className="text-primary/20"
              />
              {/* Fill */}
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={reducedMotion ? 0 : dashOffset}
                strokeLinecap="round"
                className="text-primary transition-none"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LongPressComplete;
