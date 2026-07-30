import { Lock, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import type { ITask } from '@/lib/types';

import MonthDensity from './MonthDensity';
import MonthGrid from './MonthGrid';

interface CalendarTeaserProps {
  /** Padded current-month grid — the same shape the real month view draws. */
  days: Date[];
  anchor: Date;
  tasksByDay: Map<string, ITask[]>;
  todayKey: string;
  isMobile: boolean;
}

const noop = () => {};

/**
 * The locked calendar a free user sees. Deliberately renders the REAL month
 * chrome with the user's actual tasks behind the blur — seeing your own data
 * locked converts far better than a generic screenshot or a hidden nav item.
 * The blurred layer is `inert`, so nothing behind it can be clicked or focused;
 * the only interactive element is the upgrade CTA.
 */
const CalendarTeaser = ({ days, anchor, tasksByDay, todayKey, isMobile }: CalendarTeaserProps) => {
  const { t } = useTranslation('task');
  const { t: tCommon } = useTranslation('common');

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60" data-testid="calendar-teaser">
      <div inert aria-hidden className="pointer-events-none select-none blur-[3px]" data-testid="calendar-teaser-grid">
        {isMobile ? (
          <MonthDensity days={days} anchor={anchor} tasksByDay={tasksByDay} todayKey={todayKey} onDrillDown={noop} />
        ) : (
          <MonthGrid
            days={days}
            anchor={anchor}
            tasksByDay={tasksByDay}
            todayKey={todayKey}
            onDrillDown={noop}
            onSelect={noop}
          />
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-background/40 p-4">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-border/60 bg-background/95 p-6 text-center shadow-lg">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-lg font-semibold text-foreground">{t('calendar.teaserTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('calendar.teaserDescription')}</p>
          <Button asChild data-testid="calendar-teaser-cta">
            {/* TODO: point at billing page (E-030), same as PlanLimitAlert */}
            <Link to="/settings">
              <Zap className="h-4 w-4" />
              {tCommon('planLimit.cta')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalendarTeaser;
