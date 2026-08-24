import type { INotification } from '@nicoflow/shared/types';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Timestamp } from '@/components';
import { getDateLocale } from '@/lib/i18n/dateLocale';
import { cn } from '@/lib/utils';
import { PROJECT_TAB_PARAM, PROJECT_TASK_PARAM } from '@/pages/project/tabs';

import { categoryForType, iconForType, NotificationCategory, styleForCategory } from '../../notificationTypes';

export interface NotificationRowProps {
  notification: INotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  busy?: boolean;
}

// Resolve a navigation target for reminder/celebration rows.
// Returns null for summary/system categories (those expand in-place instead).
//
// When metadata carries both entityId (task) and projectId we build a URL that
// navigates to the project page, forces the tasks tab, and carries the task id
// so TasksSection can auto-open the detail dialog on arrival.
const resolveEntityPath = (notification: INotification): string | null => {
  const category = categoryForType(notification.type);
  if (category !== NotificationCategory.REMINDER && category !== NotificationCategory.CELEBRATION) {
    return null;
  }
  const meta = notification.metadata;
  const projectId = typeof meta.projectId === 'string' ? meta.projectId : null;
  if (!projectId) return null;

  const entityId = typeof meta.entityId === 'string' ? meta.entityId : null;
  const entityType = typeof meta.entityType === 'string' ? meta.entityType : null;
  if (entityId && entityType === 'task') {
    return `/projects/${projectId}?${PROJECT_TAB_PARAM}=tasks&${PROJECT_TASK_PARAM}=${entityId}`;
  }
  return `/projects/${projectId}`;
};

// One notification. Unread rows carry a left accent bar and full-weight text; read
// rows quietly dim. The mark-read + dismiss actions stay hidden until the row is
// hovered or focused (keyboard users get them via focus-within), so the resting
// state is calm.
//
// Visual treatment is category-driven: reminder=amber, celebration=emerald,
// summary=muted, system=primary (pinned accent). Clicking the row body for
// reminder/celebration navigates to the entity; summary/system expand the body
// in-place since they have no single entity target.
export const NotificationRow = ({ notification, onMarkRead, onDismiss, busy }: NotificationRowProps) => {
  const { t, i18n } = useTranslation('notification');
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const Icon = iconForType(notification.type);
  const category = categoryForType(notification.type);
  const style = styleForCategory(category);
  const entityPath = resolveEntityPath(notification);
  const unread = !notification.isRead;

  const handleRowClick = () => {
    if (entityPath) {
      navigate(entityPath);
    }
  };

  const isNavigable = entityPath !== null;

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
      data-testid="notification-row"
      data-category={category}
      className={cn(
        'group relative flex gap-3 rounded-lg px-3 py-2.5 transition-colors focus-within:bg-accent/60 hover:bg-accent/60',
        !unread && 'opacity-60',
        isNavigable && 'cursor-pointer'
      )}
      onClick={isNavigable ? handleRowClick : undefined}
      role={isNavigable ? 'button' : undefined}
      tabIndex={isNavigable ? 0 : undefined}
      onKeyDown={
        isNavigable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRowClick();
              }
            }
          : undefined
      }
    >
      {/* Unread accent bar — category-coloured. */}
      {unread && (
        <span
          aria-hidden
          className={cn('absolute inset-y-2 start-0 w-[3px] rounded-full', style.accent)}
          data-testid="unread-bar"
        />
      )}

      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          style.iconBg,
          style.iconText
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
      <div
        className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
        onClick={e => e.stopPropagation()}
      >
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
