import { useEffect, useState } from 'react';

import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { clearRateLimit, selectRateLimitRetryAt, useAppDispatch, useAppSelector } from '@/lib/store';

// A slim, fixed banner shown while the user is rate-limited (429). It counts
// down to the Retry-After time and auto-clears itself, so the "reload → every
// request 429s" state reads as a temporary throttle instead of a broken app.
export const RateLimitBanner = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const retryAt = useAppSelector(selectRateLimitRetryAt);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (retryAt === null) return;

    const tick = () => {
      const remaining = Math.ceil((retryAt - Date.now()) / 1000);
      if (remaining <= 0) {
        dispatch(clearRateLimit());
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(remaining);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [retryAt, dispatch]);

  if (retryAt === null || secondsLeft <= 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="rate-limit-banner"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-center text-sm font-medium text-destructive-foreground shadow-md"
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden />
      <span>{t('rateLimit.banner', { seconds: secondsLeft })}</span>
    </div>
  );
};
