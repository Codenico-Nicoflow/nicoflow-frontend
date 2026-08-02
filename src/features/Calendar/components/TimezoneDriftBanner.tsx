import { useState } from 'react';

import { Globe, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useUpdateProfileMutation } from '@/lib/store';
import { showErrorToast } from '@/lib/utils';

import { dismissDrift } from '../timezoneDismissal';
import { formatZoneOffset, type TimezoneDrift } from '../timezoneDrift';

export const TIMEZONE_DRIFT_BANNER_TESTID = 'timezone-drift-banner';

interface TimezoneDriftBannerProps {
  drift: TimezoneDrift;
  /** Instant the offsets are labelled at — injected so stories/tests are stable. */
  now: Date;
  /** Called after a dismissal or a successful update, so the caller can hide us. */
  onResolved: () => void;
}

/** `Europe/Paris (UTC+02:00)`, degrading to the bare name if Intl refuses it. */
const zoneLabel = (timezone: string, now: Date): string => {
  const offset = formatZoneOffset(timezone, now);
  const name = timezone.replace(/_/g, ' ');
  return offset ? `${name} (${offset})` : name;
};

/**
 * Non-blocking prompt shown when the browser zone disagrees with the account
 * zone.
 *
 * Deliberately NOT a toast and NOT a modal: a toast scrolls away before the
 * user has read two zone names, and a modal would block a calendar the user
 * opened to do something else. It also never auto-applies the browser zone —
 * adopting a new zone silently would shift every reminder the user has, so the
 * change stays an explicit choice.
 */
const TimezoneDriftBanner = ({ drift, now, onResolved }: TimezoneDriftBannerProps) => {
  const { t } = useTranslation('task');
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = () => {
    setIsDismissing(true);
    dismissDrift(drift.accountZone, drift.browserZone);
    onResolved();
  };

  const handleUpdate = async (): Promise<void> => {
    try {
      await updateProfile({ timezone: drift.browserZone }).unwrap();
      toast.success(t('calendar.timezoneDrift.updated', { zone: drift.browserZone.replace(/_/g, ' ') }));
      // The drift is gone once the profile refetches, but resolving here means
      // the banner leaves immediately rather than lingering for a round trip.
      onResolved();
    } catch (error) {
      // An unresolvable zone comes back as INVALID_INPUT (422). Keep the banner
      // open so the user can still dismiss it.
      showErrorToast(error, toast);
    }
  };

  const isBusy = isLoading || isDismissing;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={TIMEZONE_DRIFT_BANNER_TESTID}
      className="relative flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:gap-4"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Globe className="h-5 w-5" aria-hidden />
      </span>

      <div className="flex-1 space-y-1 pe-8 sm:pe-0">
        <p className="text-sm font-semibold text-foreground">{t('calendar.timezoneDrift.title')}</p>
        <p className="text-sm text-muted-foreground">
          {t('calendar.timezoneDrift.description', {
            accountZone: zoneLabel(drift.accountZone, now),
            browserZone: zoneLabel(drift.browserZone, now),
          })}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" disabled={isBusy} onClick={() => void handleUpdate()} data-testid="timezone-drift-update">
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {t('calendar.timezoneDrift.update')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isBusy}
          onClick={handleDismiss}
          data-testid="timezone-drift-dismiss"
          // Icon-only on mobile where the row is tight, so it keeps a label for
          // screen readers either way.
          aria-label={t('calendar.timezoneDrift.dismiss')}
          className="absolute end-2 top-2 h-8 w-8 p-0 sm:static sm:h-8 sm:w-auto sm:px-3"
        >
          <X className="h-4 w-4 sm:hidden" aria-hidden />
          <span className="sr-only sm:not-sr-only">{t('calendar.timezoneDrift.dismiss')}</span>
        </Button>
      </div>
    </div>
  );
};

export default TimezoneDriftBanner;
