import { Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';

import { usePushSubscription } from '../../push';

// The tab-closed Web Push toggle (Pro-only). Free users who try to enable it get an
// upgrade prompt (toast with a link to billing) and no subscription is created —
// the Pro gate lives in the hook, so nothing is requested for a free plan. Hidden
// entirely when the browser can't do Web Push, so we never show a dead control.
export const PushToggle = () => {
  const { t } = useTranslation('notification');
  const { supported, enabled, busy, enable, disable } = usePushSubscription();

  if (!supported) return null;

  const onToggle = async (next: boolean) => {
    if (!next) {
      await disable();
      return;
    }
    const result = await enable();
    if (result === 'subscribed') {
      toast.success(t('push.enabled'));
      return;
    }
    if (result === 'needs-upgrade') {
      // One upgrade prompt with an inline link to billing — no subscription was
      // attempted (the Pro gate is in the hook).
      toast(t('push.upgradeTitle'), {
        description: (
          <span className="text-muted-foreground">
            {t('push.upgradeBody')}{' '}
            <Link to="/profile" className="font-medium text-primary underline-offset-2 hover:underline">
              {t('push.upgradeCta')}
            </Link>
          </span>
        ),
      });
      return;
    }
    if (result === 'permission-denied') toast.error(t('push.permissionDenied'));
    else if (result === 'error') toast.error(t('push.failed'));
  };

  return (
    <div className="flex items-center gap-2.5 border-t border-border/60 px-3 py-2.5">
      <Smartphone aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
      <label htmlFor="push-toggle" className="flex-1 cursor-pointer text-xs text-muted-foreground">
        {t('push.label')}
      </label>
      <Switch
        id="push-toggle"
        checked={enabled}
        disabled={busy}
        onCheckedChange={onToggle}
        aria-label={t('push.label')}
        data-testid="push-toggle"
      />
    </div>
  );
};
