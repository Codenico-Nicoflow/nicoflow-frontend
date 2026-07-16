import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface LiveUpdatesBannerProps {
  // True while the socket has been down past the first retry. The 60s poll still
  // keeps data fresh underneath — this only tells the user real-time is degraded.
  paused: boolean;
}

// A slim, non-blocking banner that slides in below the topbar when live updates
// pause. Deliberately calm (muted, not destructive) — nothing is broken, updates
// are just slower — and it clears itself the moment the socket reconnects. Honours
// reduced-motion by fading instead of sliding.
export const LiveUpdatesBanner = ({ paused }: LiveUpdatesBannerProps) => {
  const { t } = useTranslation('notification');
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {paused && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden border-b border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          data-testid="live-updates-banner"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium">
            <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{t('realtime.paused')}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
