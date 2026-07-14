import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

const CAP = 99;

export interface UnreadBadgeProps {
  count: number;
  className?: string;
}

// The unread badge floats over the bell's top-right corner (absolute, so its
// appearance never shifts the bell's layout). It scale-pops in and animates each
// time the count changes — the small reward that makes a new notification feel
// noticed without nagging. Reduced motion collapses to a plain fade.
export const UnreadBadge = ({ count, className }: UnreadBadgeProps) => {
  const reduce = useReducedMotion();
  const label = count > CAP ? `${CAP}+` : String(count);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key="badge"
          data-testid="notification-badge"
          aria-hidden
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
          transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 700, damping: 22 }}
          className={cn(
            'pointer-events-none absolute -end-0.5 -top-0.5 flex min-w-[1.05rem] items-center justify-center rounded-full bg-destructive px-1 text-[0.65rem] font-semibold leading-none text-destructive-foreground shadow-sm ring-2 ring-background',
            className
          )}
        >
          {/* Re-key on the value so each change replays the pop, not just mount. */}
          <motion.span
            key={label}
            initial={reduce ? false : { y: -3, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={reduce ? { duration: 0.1 } : { type: 'spring', stiffness: 600, damping: 20 }}
            className="tabular-nums"
          >
            {label}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  );
};
