import { Pause, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { estimateProgress, formatClock } from '../timerUtils';
import type { FocusTimerStatus } from '../useFocusTimer';

interface FocusTimerProps {
  seconds: number;
  estimatedMinutes: number | null;
  status: FocusTimerStatus;
  isBusy: boolean;
  onPause: () => void;
  onResume: () => void;
}

const RING_SIZE = 56;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Display-only actual-vs-estimate ring. Capped at a full circle; past the
// estimate it recolors instead of lapping — a calm "over", never a red alarm.
const EstimateRing = ({ progress }: { progress: number }) => {
  const capped = Math.min(progress, 1);
  const over = progress > 1;
  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={RING_STROKE}
        className="stroke-muted"
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={RING_CIRCUMFERENCE * (1 - capped)}
        className={over ? 'stroke-amber-500' : 'stroke-primary'}
      />
    </svg>
  );
};

// The stopwatch block on the NOW card: cumulative time-on-task, the estimate
// ring, a paused/ended-elsewhere state, and the pause/resume control. Pure
// display — the lifecycle lives in useFocusTimer.
const FocusTimer = ({ seconds, estimatedMinutes, status, isBusy, onPause, onResume }: FocusTimerProps) => {
  const { t } = useTranslation('task');

  if (status === 'starting') {
    return (
      <div className="flex items-center gap-4" data-testid="focus-timer-starting">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  const progress = estimateProgress(seconds, estimatedMinutes);
  const running = status === 'running';

  return (
    <div className="flex items-center gap-4" data-testid="focus-timer">
      {progress !== null && <EstimateRing progress={progress} />}

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-2xl font-semibold tabular-nums ${running ? 'text-foreground' : 'text-muted-foreground'}`}
            data-testid="focus-timer-clock"
            aria-label={t('focus.timer.label')}
          >
            {formatClock(seconds)}
          </span>
          {status === 'paused' && (
            <span
              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              data-testid="focus-timer-paused"
            >
              {t('focus.timer.paused')}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {status === 'endedElsewhere'
            ? t('focus.timer.endedElsewhere')
            : progress !== null && estimatedMinutes !== null
              ? progress > 1
                ? t('focus.timer.overEstimate', { minutes: estimatedMinutes })
                : t('focus.timer.ofEstimate', { minutes: estimatedMinutes })
              : t('focus.timer.noEstimate')}
        </p>
      </div>

      <div className="ms-auto">
        {running ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onPause}
            disabled={isBusy}
            data-testid="focus-timer-pause"
            aria-label={t('focus.timer.pause')}
          >
            <Pause className="h-4 w-4 me-1.5" aria-hidden />
            {t('focus.timer.pause')}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onResume}
            disabled={isBusy}
            data-testid="focus-timer-resume"
            aria-label={t('focus.timer.resume')}
          >
            <Play className="h-4 w-4 me-1.5" aria-hidden />
            {t('focus.timer.resume')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FocusTimer;
