import { AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { EmptyState } from '@/components';
import { PopoverContent } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAppUser,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from '@/lib/store';
import { USER_STATUS } from '@/lib/types';

import { enableDesktopNotifications, useDesktopEnabled } from '../../desktop/useDesktopNotification';

import { DigestToggle } from './DigestToggle';
import { NotificationPreferences } from './NotificationPreferences';
import { NotificationRow } from './NotificationRow';
import { PushToggle } from './PushToggle';

export interface NotificationPanelProps {
  // The panel only fetches while the popover is open — the count poll on the bell
  // is enough to keep the badge fresh; the list is loaded on demand.
  open: boolean;
}

const SkeletonRows = () => (
  <div className="space-y-1 p-1" data-testid="notification-skeleton">
    {[0, 1, 2].map(i => (
      <div key={i} className="flex gap-3 px-3 py-2.5">
        <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
    ))}
  </div>
);

export const NotificationPanel = ({ open }: NotificationPanelProps) => {
  const { t } = useTranslation('notification');

  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;
  const desktopEnabled = useDesktopEnabled();
  const { data, isLoading } = useGetNotificationsQuery(undefined, { skip: !open });
  const [markRead, { isLoading: isMarking }] = useMarkReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  const items = data?.items ?? [];
  const hasUnread = items.some(n => !n.isRead);
  const busy = isMarking || isDeleting;

  const onMarkRead = (id: string) => {
    // Fire-and-forget: the tag invalidation refetches the list; no toast for a
    // single mark-read (it's a quiet, expected action).
    markRead(id);
  };

  const onDismiss = (id: string) => {
    deleteNotification(id)
      .unwrap()
      .then(() => toast.success(t('toast.dismissed')))
      .catch(() => undefined);
  };

  // Desktop (foreground push) is a Pro feature. A free user who tries to enable it
  // gets an upgrade prompt and nothing is turned on — never request permission for a
  // plan that can't use it. Enabling for Pro requests OS permission; a browser denial
  // is surfaced so the user knows why the toggle didn't stick.
  const onToggleDesktop = async () => {
    const next = !desktopEnabled;
    if (next && !isPro) {
      toast(t('push.upgradeTitle'), {
        description: (
          <span className="text-muted-foreground">
            {t('desktop.upgradeBody')}{' '}
            <Link to="/profile" className="font-medium text-primary underline-offset-2 hover:underline">
              {t('push.upgradeCta')}
            </Link>
          </span>
        ),
      });
      return;
    }
    const granted = await enableDesktopNotifications(next);
    if (next && !granted) toast.error(t('desktop.denied'));
  };

  const onMarkAll = () => {
    markAllRead()
      .unwrap()
      .then(() => toast.success(t('toast.markedAllRead')))
      .catch(() => undefined);
  };

  return (
    <PopoverContent
      align="end"
      sideOffset={8}
      className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden p-0"
      data-testid="notification-panel"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
        <h2 className="text-sm font-semibold text-foreground">{t('panel.title')}</h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onToggleDesktop}
            aria-label={desktopEnabled ? t('desktop.disable') : t('desktop.enable')}
            aria-pressed={desktopEnabled}
            title={desktopEnabled ? t('desktop.disable') : t('desktop.enable')}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="desktop-toggle"
          >
            {desktopEnabled ? <Bell className="h-4 w-4" aria-hidden /> : <BellOff className="h-4 w-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={onMarkAll}
            disabled={!hasUnread || isMarkingAll}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
            data-testid="mark-all-read-button"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden />
            {t('panel.markAllRead')}
          </button>
        </div>
      </header>

      <div className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain">
        {isLoading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState icon={BellOff} title={t('panel.empty')} />
          </div>
        ) : (
          <ul className="space-y-0.5 p-1" data-testid="notification-list">
            <AnimatePresence initial={false}>
              {items.map(n => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onMarkRead={onMarkRead}
                  onDismiss={onDismiss}
                  busy={busy}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <NotificationPreferences />
      <DigestToggle />
      <PushToggle />
    </PopoverContent>
  );
};
