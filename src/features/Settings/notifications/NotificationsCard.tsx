import type { INotificationPref } from '@nicoflow/shared/types';
import { USER_STATUS } from '@nicoflow/shared/types';
import { Mail, Moon, Sunrise, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppUser, useGetPreferencesQuery, useUpdatePreferencesMutation } from '@/lib/store';

import { PreferenceRow } from './PreferenceRow';
import { PushToggle } from './PushToggle';
import { ReminderHoursSection } from './ReminderHoursSection';

const DEFAULT_MORNING_HOUR = 8;
const DEFAULT_EVENING_HOUR = 20;

// Boolean prefs surfaced here: emailDigest (Pro) + the morning/evening digest
// toggles (free, unified across plans) + streaks (Pro) + Push (E-037). SMS is
// deliberately absent — it has no delivery path yet, so a toggle for it would be
// a broken promise.
type ToggleKey = 'emailDigest' | 'morningDigestEnabled' | 'eveningDigestEnabled' | 'streaksEnabled';
type LabelKey = 'digest.label' | 'prefs.morningDigest' | 'prefs.eveningDigest' | 'prefs.streaks';

const TOGGLE_META: {
  key: ToggleKey;
  icon: typeof Mail;
  labelKey: LabelKey;
  pro: boolean;
  testId: string;
}[] = [
  { key: 'emailDigest', icon: Mail, labelKey: 'digest.label', pro: true, testId: 'pref-email-digest' },
  {
    key: 'morningDigestEnabled',
    icon: Sunrise,
    labelKey: 'prefs.morningDigest',
    pro: false,
    testId: 'pref-morning-digest',
  },
  {
    key: 'eveningDigestEnabled',
    icon: Moon,
    labelKey: 'prefs.eveningDigest',
    pro: false,
    testId: 'pref-evening-digest',
  },
  { key: 'streaksEnabled', icon: Trophy, labelKey: 'prefs.streaks', pro: true, testId: 'pref-streaks' },
];

// Notification preferences, relocated from the bell panel (NIC-1613). Toggles + the
// two reminder-hour dropdowns auto-save via PUT /notifications/preferences — no save
// button. Loading shows skeleton rows; saving disables every control so a value is
// never shown that isn't being committed. Pro-only rows are locked for free users and
// route to the upgrade prompt instead of writing.
export const NotificationsCard = () => {
  const { t } = useTranslation('notification');
  const { t: tc } = useTranslation('common');
  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;

  const { data: prefs, isLoading } = useGetPreferencesQuery();
  const [updatePreferences, { isLoading: isSaving }] = useUpdatePreferencesMutation();

  const onToggle = (key: ToggleKey, next: boolean) => {
    updatePreferences({ [key]: next });
  };

  const onLockedClick = () => {
    toast(t('push.upgradeTitle'), {
      description: (
        <span className="text-muted-foreground">
          {t('prefs.upgradeBody')}{' '}
          <Link to="/settings" className="font-medium text-primary underline-offset-2 hover:underline">
            {t('push.upgradeCta')}
          </Link>
        </span>
      ),
    });
  };

  const onHoursChange = (patch: Partial<Pick<INotificationPref, 'morningHour' | 'eveningHour'>>) => {
    updatePreferences(patch);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tc('pages.settings.notificationsSection')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-0">
        {isLoading ? (
          <div className="space-y-2 px-6 py-1" data-testid="notifications-skeleton">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-2.5 py-1">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3">
            {TOGGLE_META.map(f => {
              const locked = f.pro && !isPro;
              return (
                <PreferenceRow
                  key={f.key}
                  icon={f.icon}
                  label={t(f.labelKey)}
                  checked={prefs?.[f.key] ?? (f.key === 'emailDigest' ? false : true)}
                  disabled={isSaving}
                  locked={locked}
                  onChange={next => onToggle(f.key, next)}
                  onLockedClick={onLockedClick}
                  testId={f.testId}
                />
              );
            })}
            <PushToggle isPro={isPro} disabled={isSaving} onLockedClick={onLockedClick} />
          </div>
        )}

        <ReminderHoursSection
          morningHour={prefs?.morningHour ?? DEFAULT_MORNING_HOUR}
          eveningHour={prefs?.eveningHour ?? DEFAULT_EVENING_HOUR}
          isLoading={isLoading}
          isSaving={isSaving}
          onChange={onHoursChange}
        />
      </CardContent>
    </Card>
  );
};
