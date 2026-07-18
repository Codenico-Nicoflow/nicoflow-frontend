import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { HourPicker } from './HourPicker';

// Reminder-hour ranges — mirror the backend CHECK constraints (migration 035).
const MORNING_HOURS = [5, 6, 7, 8, 9, 10, 11];
const EVENING_HOURS = [18, 19, 20, 21, 22];

interface ReminderHoursSectionProps {
  morningHour: number;
  eveningHour: number;
  isLoading: boolean;
  isSaving: boolean;
  onChange: (patch: { morningHour?: number; eveningHour?: number }) => void;
}

// Two hour dropdowns (morning + evening) with helper copy explaining what each
// drives and a note on the hour-only granularity. Loading shows skeletons; saving
// disables both pickers so a control never displays a value it isn't committing.
export const ReminderHoursSection = ({
  morningHour,
  eveningHour,
  isLoading,
  isSaving,
  onChange,
}: ReminderHoursSectionProps) => {
  const { t, i18n } = useTranslation('notification');

  return (
    <div className="border-t border-border/60 px-3 py-2.5">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{t('prefs.hours.title')}</p>

      {isLoading ? (
        <div className="space-y-2" data-testid="hours-skeleton">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          <HourPicker
            icon={Sun}
            label={t('prefs.hours.morningLabel')}
            help={t('prefs.hours.morningHelp')}
            value={morningHour}
            hours={MORNING_HOURS}
            locale={i18n.language}
            disabled={isSaving}
            onChange={h => onChange({ morningHour: h })}
            testId="morning-hour"
          />
          <HourPicker
            icon={Moon}
            label={t('prefs.hours.eveningLabel')}
            help={t('prefs.hours.eveningHelp')}
            value={eveningHour}
            hours={EVENING_HOURS}
            locale={i18n.language}
            disabled={isSaving}
            onChange={h => onChange({ eveningHour: h })}
            testId="evening-hour"
          />
        </div>
      )}

      <p className="mt-2 ps-[1.625rem] text-[11px] leading-snug text-muted-foreground/70">{t('prefs.hours.note')}</p>
    </div>
  );
};
