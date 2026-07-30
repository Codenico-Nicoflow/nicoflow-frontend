import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { getDateLocale } from '@/lib/i18n/dateLocale';
import { cn } from '@/lib/utils';

import { CALENDAR_VIEWS, type CalendarView } from '../data';

interface CalendarToolbarProps {
  view: CalendarView;
  anchor: Date;
  onViewChange: (view: CalendarView) => void;
  onShift: (direction: 1 | -1) => void;
  onToday: () => void;
  /** Locked users get one shape (the teaser month), so the switcher is dropped
   *  rather than disabled — three dead buttons explain nothing. Month stepping
   *  stays: browsing your own locked data is the point of the teaser. */
  hideViewSwitcher?: boolean;
}

const CalendarToolbar = ({ view, anchor, onViewChange, onShift, onToday, hideViewSwitcher }: CalendarToolbarProps) => {
  const { t, i18n } = useTranslation('task');
  const locale = getDateLocale(i18n.language);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3" data-testid="calendar-toolbar">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onShift(-1)}
          aria-label={t('calendar.previous')}
          data-testid="calendar-prev"
        >
          {/* Chevrons are direction-agnostic here: RTL mirrors the whole row. */}
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onShift(1)}
          aria-label={t('calendar.next')}
          data-testid="calendar-next"
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Button>
        <Button variant="ghost" onClick={onToday} data-testid="calendar-today">
          {t('calendar.today')}
        </Button>
        <span className="text-sm font-medium text-foreground" data-testid="calendar-anchor-label">
          {format(anchor, 'MMMM yyyy', { locale })}
        </span>
      </div>

      {!hideViewSwitcher && (
        <div className="flex items-center gap-1" role="group" aria-label={t('calendar.viewSwitcher')}>
          {CALENDAR_VIEWS.map(option => (
            <Button
              key={option}
              variant={view === option ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(option)}
              aria-pressed={view === option}
              className={cn('capitalize')}
              data-testid={`calendar-view-${option}`}
            >
              {t(`calendar.views.${option}`)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarToolbar;
