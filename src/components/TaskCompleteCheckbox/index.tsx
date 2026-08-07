import * as React from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import {
  buildBurstVariants,
  buildCheckboxTransition,
  buildCheckboxVariants,
  BURST_PARTICLES,
  BURST_TRANSITION,
} from './animation';

export interface TaskCompleteCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  /**
   * When true the parent's confirm-dialog gate will fire on click — the component
   * defers the animation until the parent calls `playCompleteAnimation()` after
   * the dialog is accepted.
   */
  deferAnimation?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /**
   * Adds extra padding around the visible checkbox to widen the invisible hit zone.
   * The visual box stays the same size — only the clickable area grows.
   */
  expandHitArea?: boolean;
  'aria-label': string;
  'data-testid'?: string;
  className?: string;
}

export interface TaskCompleteCheckboxHandle {
  /** Plays the completion animation. Idempotent — no-op if already animating. */
  playCompleteAnimation: () => void;
}

type AnimationPhase = 'idle' | 'completing' | 'uncompleting';

export const TaskCompleteCheckbox = React.forwardRef<TaskCompleteCheckboxHandle, TaskCompleteCheckboxProps>(
  (
    {
      checked,
      onToggle,
      deferAnimation = false,
      disabled = false,
      size = 'md',
      expandHitArea = false,
      'aria-label': ariaLabel,
      'data-testid': testId,
      className,
    },
    ref
  ) => {
    const reducedMotion = useReducedMotion();
    const [phase, setPhase] = React.useState<AnimationPhase>('idle');
    const prevCheckedRef = React.useRef(checked);

    // Track external prop changes without triggering animation — only
    // explicit click/handle paths animate.
    React.useEffect(() => {
      prevCheckedRef.current = checked;
    });

    React.useImperativeHandle(ref, () => ({
      playCompleteAnimation() {
        if (phase === 'completing') return;
        setPhase('completing');
        if (!reducedMotion) {
          navigator.vibrate?.(10);
        }
      },
    }));

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;

      onToggle();

      if (checked) {
        // uncomplete: no burst
        setPhase('uncompleting');
        return;
      }

      if (!deferAnimation) {
        setPhase('completing');
        if (!reducedMotion) {
          navigator.vibrate?.(10);
        }
      }
    };

    const checkboxVariants = buildCheckboxVariants(reducedMotion);
    const checkboxTransition = buildCheckboxTransition(reducedMotion);

    // expandHitArea adds generous invisible padding so more of the row column is
    // tappable, without changing the visible checkbox box.
    const wrapperPadding = expandHitArea ? 'p-3' : size === 'sm' ? 'p-1.5' : 'p-2';
    const boxSize = size === 'sm' ? 'size-5' : 'size-6';

    return (
      <div className={cn('relative flex items-center justify-center', className)} data-animation-phase={phase}>
        {/* Burst particles — only rendered during completion, and only when motion is allowed */}
        <AnimatePresence>
          {phase === 'completing' && !reducedMotion && (
            <>
              {BURST_PARTICLES.map(particle => (
                <motion.span
                  key={particle.index}
                  aria-hidden
                  className="pointer-events-none absolute size-1.5 rounded-full bg-primary"
                  variants={buildBurstVariants(particle)}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={BURST_TRANSITION}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <motion.div
          className={cn('flex items-center justify-center rounded-sm', wrapperPadding)}
          variants={checkboxVariants}
          animate={phase !== 'idle' ? phase : 'idle'}
          initial="idle"
          transition={checkboxTransition}
          onAnimationComplete={() => {
            if (phase !== 'idle') setPhase('idle');
          }}
        >
          <Checkbox
            checked={checked}
            disabled={disabled}
            aria-label={ariaLabel}
            data-testid={testId}
            className={cn('cursor-pointer disabled:cursor-not-allowed', boxSize)}
            onClick={handleClick}
          />
        </motion.div>
      </div>
    );
  }
);

TaskCompleteCheckbox.displayName = 'TaskCompleteCheckbox';
