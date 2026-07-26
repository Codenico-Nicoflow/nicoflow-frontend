import { useEffect, useRef } from 'react';

// Local calendar day as YYYY-MM-DD, in the browser's own timezone.
const localDayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
};

const msUntilNextMidnight = (): number => {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return midnight.getTime() - now.getTime();
};

/**
 * Fires `onChange` whenever the local calendar day rolls over while the app
 * stays open — so day-bucketed views (Time Spread, Today badge) refresh instead
 * of showing yesterday's buckets. Covers both an idle-open tab (a midnight timer)
 * and a machine that slept past midnight (a visibility/focus recheck on wake),
 * since a suspended timer can miss the rollover entirely.
 */
export const useDayChange = (onChange: () => void): void => {
  const lastDayRef = useRef(localDayKey());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const checkRollover = () => {
      const today = localDayKey();
      if (today !== lastDayRef.current) {
        lastDayRef.current = today;
        onChangeRef.current();
      }
    };

    const scheduleMidnight = () => {
      timer = setTimeout(() => {
        checkRollover();
        scheduleMidnight();
      }, msUntilNextMidnight());
    };

    const onWake = () => {
      if (document.visibilityState === 'visible') checkRollover();
    };

    scheduleMidnight();
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, []);
};
