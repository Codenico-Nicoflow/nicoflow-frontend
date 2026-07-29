import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppUser, useUpdateProfileMutation } from '@/lib/store';
import { resolveTimeZone, showErrorToast } from '@/lib/utils';

import { SUPPORTED_TIMEZONES } from './timezones';

// Lets a user see and override their stored timezone (NIC-1776). The backend
// plumbing already exists end to end — PATCH /users/me validates against
// time.LoadLocation — so this is purely the missing control.
//
// Why it matters: self-heal only fires on login, and with refresh-token rotation
// an engaged user can stay signed in for months. Someone who moves country, or
// whose machine was on UTC at signup, otherwise keeps a stale zone forever — an
// hour-off nuisance for notifications, a wrong-day bug for recurrence.
export const TimezoneSelect = () => {
  const { t } = useTranslation('common');
  const user = useAppUser();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  // Fall back to the browser's zone so the control never renders empty for a
  // profile that predates the field.
  const current = user?.timezone || resolveTimeZone();

  // On engines without Intl.supportedValuesOf the list is a spanning fallback,
  // not the full database — so a stored zone outside it is prepended rather than
  // silently dropped, which would otherwise blank the control.
  const options = SUPPORTED_TIMEZONES.includes(current) ? SUPPORTED_TIMEZONES : [current, ...SUPPORTED_TIMEZONES];

  const onChange = async (timezone: string) => {
    if (timezone === current) return;
    try {
      await updateProfile({ timezone }).unwrap();
    } catch (error) {
      // An invalid zone comes back as INVALID_INPUT (422); surface it legibly
      // rather than silently reverting the select.
      showErrorToast(error, toast);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="settings-timezone" className="flex items-center gap-2">
        {t('pages.settings.timezoneLabel')}
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </Label>
      <Select value={current} disabled={isLoading} onValueChange={value => void onChange(value)}>
        <SelectTrigger id="settings-timezone" data-testid="settings-timezone-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map(tz => (
            <SelectItem key={tz} value={tz} data-testid={`settings-timezone-${tz}`}>
              {tz.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{t('pages.settings.timezoneDescription')}</p>
    </div>
  );
};
