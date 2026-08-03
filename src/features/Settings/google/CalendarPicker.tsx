import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type IGoogleCalendar,
  MAX_SELECTED_CALENDARS,
  useGetGoogleCalendarsQuery,
  useUpdateGoogleCalendarSelectionMutation,
} from '@/lib/store';
import { ToastMessages } from '@/lib/utils';

import { isAtCap, isDisabledByCap, selectedIds, toggleCalendar } from './calendarSelection';

const CALENDAR_PICKER_TEST_ID = 'google-calendar-picker';

/**
 * Which Google calendars overlay the Nicoflow calendar (NIC-1857).
 *
 * A Google account is not one calendar — importing everything would tint every
 * day and turn the overlay from "you are booked" into noise. The primary
 * calendar is selected by default so the feature works immediately after OAuth;
 * this picker is progressive disclosure for people who want more.
 */
export const CalendarPicker = () => {
  const { t } = useTranslation('common');
  const { data: calendars, isLoading, isError } = useGetGoogleCalendarsQuery();
  const [updateSelection, { isLoading: isSaving }] = useUpdateGoogleCalendarSelectionMutation();

  const handleToggle = async (calendar: IGoogleCalendar) => {
    const next = toggleCalendar(calendars ?? [], calendar.id);

    try {
      await updateSelection(next).unwrap();
    } catch {
      // The list is server-owned, so a failed write leaves the checkboxes
      // showing the truth rather than an optimistic lie.
      toast.error(ToastMessages.UNEXPECTED_ERROR);
    }
  };

  if (isLoading) {
    // Skeleton rows rather than a spinner, so the card does not collapse and
    // then jump when the real list arrives.
    return (
      <div className="flex flex-col gap-2" data-testid={`${CALENDAR_PICKER_TEST_ID}-loading`}>
        {[0, 1, 2].map(row => (
          <Skeleton key={row} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-xs text-muted-foreground" data-testid={`${CALENDAR_PICKER_TEST_ID}-error`}>
        {t('pages.settings.google.calendarsUnavailable')}
      </p>
    );
  }

  const list = calendars ?? [];
  if (list.length === 0) {
    return (
      <p className="text-xs text-muted-foreground" data-testid={`${CALENDAR_PICKER_TEST_ID}-empty`}>
        {t('pages.settings.google.noCalendars')}
      </p>
    );
  }

  const selected = selectedIds(list);
  const atCap = isAtCap(selected);

  return (
    <div className="flex flex-col gap-1" data-testid={CALENDAR_PICKER_TEST_ID}>
      {list.map(calendar => {
        const disabled = isDisabledByCap(calendar, selected) || isSaving;

        return (
          <label
            key={calendar.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted/50 has-disabled:cursor-not-allowed has-disabled:opacity-60"
          >
            <Checkbox
              checked={calendar.selected}
              disabled={disabled}
              onCheckedChange={() => void handleToggle(calendar)}
              aria-label={calendar.summary}
              data-testid={`${CALENDAR_PICKER_TEST_ID}-checkbox-${calendar.id}`}
            />
            {/* Google's own colour, for recognition in the picker only — the
                canvas flattens every calendar to one tint. */}
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: calendar.backgroundColor }}
            />
            <span className="flex-1 truncate text-xs">{calendar.summary}</span>
          </label>
        );
      })}

      {/* The reason is stated whenever the cap binds, so a disabled checkbox is
          never an unexplained dead control. */}
      <p className="px-1.5 pt-1 text-xs text-muted-foreground" data-testid={`${CALENDAR_PICKER_TEST_ID}-cap`}>
        {atCap
          ? t('pages.settings.google.calendarCapReached', { max: MAX_SELECTED_CALENDARS })
          : t('pages.settings.google.calendarCapHint', { max: MAX_SELECTED_CALENDARS })}
      </p>
    </div>
  );
};
