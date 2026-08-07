import { useState } from 'react';

import { BellOff, Smartphone, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { usePushSubscription } from '@/features/Notifications/push';
import { useUpdatePreferencesMutation } from '@/lib/store';
import { cn } from '@/lib/utils';

export interface PushToggleProps {
  isPro: boolean;
  disabled?: boolean;
  onLockedClick: () => void;
}

// Read the live browser permission — 'unsupported' when the Notification API is absent.
const getPermission = (): NotificationPermission | 'unsupported' =>
  'Notification' in window ? Notification.permission : 'unsupported';

export const PushToggle = ({ isPro, disabled, onLockedClick }: PushToggleProps) => {
  const { t } = useTranslation('notification');
  const { supported, enabled, busy, enable, disable } = usePushSubscription();
  const [updatePreferences] = useUpdatePreferencesMutation();

  // Local optimistic state while a subscribe/unsubscribe is in flight.
  const [pendingOn, setPendingOn] = useState(false);
  const [pendingOff, setPendingOff] = useState(false);

  if (!supported) return null;

  // Show a skeleton in the switch slot while the hook checks the browser subscription.
  if (busy && !pendingOn && !pendingOff) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2" aria-busy="true">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-5 w-9 rounded-full" />
      </div>
    );
  }

  const permission = getPermission();
  const permissionDenied = isPro && permission === 'denied';
  const locked = !isPro;

  const handleEnable = async () => {
    setPendingOn(true);
    try {
      const result = await enable();
      if (result === 'subscribed') {
        await updatePreferences({ pushEnabled: true });
        toast.success(t('push.enabled'));
      } else if (result === 'needs-upgrade') {
        onLockedClick();
      } else if (result === 'permission-denied') {
        toast.error(t('push.permissionDenied'));
      } else {
        toast.error(t('push.failed'));
      }
    } finally {
      setPendingOn(false);
    }
  };

  const handleDisable = async () => {
    setPendingOff(true);
    try {
      await disable();
      await updatePreferences({ pushEnabled: false });
    } finally {
      setPendingOff(false);
    }
  };

  const isEnabling = pendingOn;
  const isDisabling = pendingOff;
  const isBusy = isEnabling || isDisabling || disabled;

  const switchChecked = isEnabling ? true : isDisabling ? true : enabled;
  const switchDisabled = isBusy || locked || permissionDenied;

  let subtext: string | null = null;
  if (permissionDenied) {
    subtext = t('push.permissionDeniedShort');
  } else if (enabled || isEnabling) {
    subtext = t('push.thisDevice');
  } else if (!locked) {
    subtext = t('push.notThisDevice');
  }

  const Icon = permissionDenied ? BellOff : Smartphone;

  return (
    <div
      className={cn('flex items-center gap-2.5 px-3 py-2', locked && 'cursor-pointer')}
      onClick={locked ? onLockedClick : undefined}
      data-testid="push-toggle-row"
    >
      <Icon
        aria-hidden
        className={cn(
          'h-4 w-4 shrink-0',
          locked || permissionDenied ? 'text-muted-foreground/60' : 'text-muted-foreground'
        )}
      />
      <span
        className={cn(
          'flex flex-1 flex-col gap-0.5',
          locked || permissionDenied ? 'text-muted-foreground/70' : 'text-muted-foreground'
        )}
      >
        <span className="text-xs">
          {t('push.label')}
          {locked && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              {t('prefs.pro')}
            </span>
          )}
        </span>
        {subtext && <span className="text-[11px] leading-none opacity-75">{subtext}</span>}
      </span>
      <Switch
        checked={switchChecked}
        disabled={switchDisabled}
        onCheckedChange={next => {
          if (next) {
            void handleEnable();
          } else {
            void handleDisable();
          }
        }}
        aria-label={t('push.label')}
        data-testid="push-toggle"
      />
    </div>
  );
};
