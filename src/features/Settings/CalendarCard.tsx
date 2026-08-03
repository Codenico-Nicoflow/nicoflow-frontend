import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Weekday } from '@/features/Calendar/displayPrefs';
import { DEFAULT_CALENDAR_PREFS, resolveCalendarPrefs } from '@/features/Calendar/displayPrefs';
import { useAppUser, useUpdateProfileMutation } from '@/lib/store';
import { cn, showErrorToast } from '@/lib/utils';

import { HOUR_OPTIONS, WEEK_START_OPTIONS, weekdaysFrom } from './calendarPrefOptions';

/**
 * Calendar display preferences (NIC-1890).
 *
 * Every control writes immediately rather than sitting behind a Save button:
 * these are display settings whose effect is visible the moment the user
 * returns to the grid, so a pending state adds a step without adding safety.
 */
export const CalendarCard = () => {
  const { t } = useTranslation('common');
  const user = useAppUser();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const prefs = resolveCalendarPrefs(user?.calendar);

  const save = async (patch: Parameters<typeof updateProfile>[0]) => {
    try {
      await updateProfile(patch).unwrap();
    } catch (error) {
      // The stored value is unchanged, so the control re-renders from `prefs`
      // and visibly snaps back; this explains why.
      showErrorToast(error, toast);
    }
  };

  const toggleWorkday = (day: Weekday) => {
    const next = prefs.workdays.includes(day)
      ? prefs.workdays.filter(existing => existing !== day)
      : [...prefs.workdays, day].sort((a, b) => a - b);

    // The last day cannot be removed: an empty week renders a blank grid the
    // user has no way to navigate back out of. The server rejects it too.
    if (next.length === 0) {
      toast.error(t('pages.settings.calendar.workdaysAtLeastOne'));
      return;
    }
    void save({ workdays: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('pages.settings.calendar.title')}
          {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="settings-week-start">{t('pages.settings.calendar.weekStartLabel')}</Label>
          <Select
            value={String(prefs.weekStart)}
            disabled={isUpdating}
            onValueChange={value => void save({ weekStart: Number(value) })}
          >
            <SelectTrigger id="settings-week-start" data-testid="settings-week-start">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEK_START_OPTIONS.map(day => (
                <SelectItem key={day} value={String(day)} data-testid={`settings-week-start-${day}`}>
                  {t(`pages.settings.calendar.weekdays.${day}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t('pages.settings.calendar.workdaysLabel')}</Label>
          <p className="text-xs text-muted-foreground">{t('pages.settings.calendar.workdaysHint')}</p>
          {/* Ordered from the user's own week start, so the row reads the same
              way their calendar does. */}
          <div className="flex flex-wrap gap-1.5" data-testid="settings-workdays">
            {weekdaysFrom(prefs.weekStart).map(day => {
              const isOn = prefs.workdays.includes(day);
              return (
                <Button
                  key={day}
                  type="button"
                  variant={isOn ? 'default' : 'outline'}
                  size="sm"
                  // aria-pressed, not just colour: a toggle whose only state cue
                  // is a fill is invisible to a screen reader.
                  aria-pressed={isOn}
                  aria-label={t(`pages.settings.calendar.weekdays.${day}`)}
                  disabled={isUpdating}
                  onClick={() => toggleWorkday(day)}
                  className={cn('h-9 w-11 text-xs', !isOn && 'text-muted-foreground')}
                  data-testid={`settings-workday-${day}`}
                  data-on={isOn || undefined}
                >
                  {t(`pages.settings.calendar.weekdaysShort.${day}`)}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t('pages.settings.calendar.hoursLabel')}</Label>
          <p className="text-xs text-muted-foreground">{t('pages.settings.calendar.hoursHint')}</p>
          <div className="flex items-center gap-2">
            <Select
              value={String(prefs.dayStartHour)}
              disabled={isUpdating}
              onValueChange={value => void save({ dayStartHour: Number(value) })}
            >
              <SelectTrigger aria-label={t('pages.settings.calendar.dayStartLabel')} data-testid="settings-day-start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Only hours before the current end: the two together must
                    leave a non-empty window, and the server rejects one that
                    does not. Constraining the options means the user cannot
                    reach that error at all. */}
                {HOUR_OPTIONS.filter(hour => hour < prefs.dayEndHour).map(hour => (
                  <SelectItem key={hour} value={String(hour)}>
                    {formatHour(hour)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground">{t('pages.settings.calendar.hoursSeparator')}</span>

            <Select
              value={String(prefs.dayEndHour)}
              disabled={isUpdating}
              onValueChange={value => void save({ dayEndHour: Number(value) })}
            >
              <SelectTrigger aria-label={t('pages.settings.calendar.dayEndLabel')} data-testid="settings-day-end">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.filter(hour => hour > prefs.dayStartHour)
                  .concat(DEFAULT_CALENDAR_PREFS.dayEndHour)
                  .map(hour => (
                    <SelectItem key={hour} value={String(hour)}>
                      {formatHour(hour)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">{t('pages.settings.calendar.autoExpandHint')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * `8` → "08:00". The exclusive end 24 renders as "24:00" rather than "00:00":
 * a window shown as "08:00 – 00:00" reads as an empty or backwards range.
 */
const formatHour = (hour: number): string => `${String(hour).padStart(2, '0')}:00`;
