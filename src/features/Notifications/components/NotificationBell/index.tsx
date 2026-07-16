import { useEffect, useRef } from 'react';

import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PopoverTrigger } from '@/components/ui/popover';
import { useAppUser, useGetUnreadCountQuery } from '@/lib/store';
import { USER_STATUS } from '@/lib/types';
import { cn } from '@/lib/utils';

import { useDesktopNotification } from '../../desktop/useDesktopNotification';

import { UnreadBadge } from './UnreadBadge';

// The bell polls the cheap unread-count every 60s (the only poll in the app until
// WS lands in E-023). It is deliberately isolated: it subscribes to nothing but
// the count query, so a poll re-renders the bell alone, never the Topbar around it.
const POLL_MS = 60_000;

// A single spring swing — like a real bell rung once — plays when the unread count
// rises. It's the one moment of delight; everything else stays quiet.
const swingKeyframes = { rotate: [0, 12, -9, 6, -3, 0] };

export interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = ({ className }: NotificationBellProps) => {
  const { t } = useTranslation('notification');
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const notify = useDesktopNotification();
  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;

  const { data } = useGetUnreadCountQuery(undefined, { pollingInterval: POLL_MS });
  const count = data?.count ?? 0;

  // Ring the bell only when the count actually increases (a new arrival) — not on
  // the first load, and not when it drops because the user read something. The
  // browser notification rides the same edge (it self-guards on the enable pref +
  // permission); the swing is suppressed under reduced-motion — separate cues.
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      if (!reduce) controls.start({ ...swingKeyframes, transition: { duration: 0.6, ease: 'easeOut' } });
      // The desktop (foreground push) notification is Pro-only; the swing animation
      // stays FREE. notify() also self-guards on the enable pref + browser permission.
      if (isPro) {
        const added = count - prevCount.current;
        notify(t('desktop.title'), t('desktop.body', { count: added }));
      }
    }
    prevCount.current = count;
  }, [count, controls, reduce, notify, isPro, t]);

  const label = count > 0 ? t('bell.unreadLabel', { count }) : t('bell.label');

  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label={label}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
        data-testid="notification-bell"
      >
        {/* transform-origin at the top so the swing pivots from the bell's crown */}
        <motion.span animate={controls} style={{ originY: 0.1 }} className="inline-flex">
          <Bell className="h-[1.2rem] w-[1.2rem]" aria-hidden />
        </motion.span>
        <UnreadBadge count={count} />
      </button>
    </PopoverTrigger>
  );
};
