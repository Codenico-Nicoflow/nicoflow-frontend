import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Check, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Timestamp } from '@/components';
import { getDateLocale } from '@/lib/i18n/dateLocale';
import type { INotification } from '@/lib/types';
import { cn } from '@/lib/utils';

// Map a notification type to its glyph. Unknown types fall back to the bell so a
// new backend type never renders blank.
const typeIcon: Record<string, typeof Bell> = {
  task_due_soon: Clock,
};

export interface NotificationRowProps {
  notification: INotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  busy?: boolean;
}

// One notification. Unread rows carry a left accent bar and full-weight text; read
// rows quietly dim. The mark-read + dismiss actions stay hidden until the row is
// hovered or focused (keyboard users get them via focus-within), so the resting
// state is calm — the actions appear exactly when you're looking at the row.
export const NotificationRow = ({ notification, onMarkRead, onDismiss, busy }: NotificationRowProps) => {
  const { t, i18n } = useTranslation('notification');
  const reduce = useReducedMotion();
  const Icon = typeIcon[notification.type] ?? Bell;
  const unread = !notification.isRead;

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
      data-testid="notification-row"
      className={cn(
        'group relative flex gap-3 rounded-lg px-3 py-2.5 transition-colors focus-within:bg-accent/60 hover:bg-accent/60',
        !unread && 'opacity-60'
      )}
    >
      {/* Unread accent bar — the one persistent unread signal in the row. */}
      {unread && (
        <span
          aria-hidden
          className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-primary"
          data-testid="unread-bar"
        />
      )}

      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          unread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', unread ? 'font-medium text-foreground' : 'text-foreground/90')}>
          {notification.title}
        </p>
        {notification.body && <p className="truncate text-xs text-muted-foreground">{notification.body}</p>}
        <Timestamp date={notification.createdAt} locale={getDateLocale(i18n.language)} className="mt-0.5 block" />
      </div>

      {/* Actions: hidden at rest, revealed on hover/focus. Always reachable by
          keyboard (focusing a button flips focus-within → visible). */}
      <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        {unread && (
          <button
            type="button"
            aria-label={t('panel.markRead')}
            title={t('panel.markRead')}
            disabled={busy}
            onClick={() => onMarkRead(notification.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            data-testid="mark-read-button"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          aria-label={t('panel.dismiss')}
          title={t('panel.dismiss')}
          disabled={busy}
          onClick={() => onDismiss(notification.id)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          data-testid="dismiss-button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.li>
  );
};
