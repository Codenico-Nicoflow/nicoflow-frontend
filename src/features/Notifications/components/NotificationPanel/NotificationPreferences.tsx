import { useState } from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarClock, ChevronDown, Inbox, ListChecks, SlidersHorizontal, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { useAppUser, useGetPreferencesQuery, useUpdatePreferencesMutation } from '@/lib/store';
import { USER_STATUS } from '@/lib/types';
import { cn } from '@/lib/utils';

import { PreferenceRow } from './PreferenceRow';

// Which preference keys are Pro-only (their backend sweep is Pro). Overdue is FREE.
type FamilyKey = 'overdueEnabled' | 'dailySummaryEnabled' | 'inboxNudgesEnabled' | 'streaksEnabled';
type FamilyLabelKey = 'prefs.overdue' | 'prefs.dailySummary' | 'prefs.inboxNudges' | 'prefs.streaks';

const FAMILY_META: { key: FamilyKey; icon: typeof Inbox; labelKey: FamilyLabelKey; pro: boolean; testId: string }[] = [
  { key: 'overdueEnabled', icon: CalendarClock, labelKey: 'prefs.overdue', pro: false, testId: 'pref-overdue' },
  {
    key: 'dailySummaryEnabled',
    icon: ListChecks,
    labelKey: 'prefs.dailySummary',
    pro: true,
    testId: 'pref-daily-summary',
  },
  { key: 'inboxNudgesEnabled', icon: Inbox, labelKey: 'prefs.inboxNudges', pro: true, testId: 'pref-inbox' },
  { key: 'streaksEnabled', icon: Trophy, labelKey: 'prefs.streaks', pro: true, testId: 'pref-streaks' },
];

// A collapsible "Notification preferences" section holding the per-family switches.
// Collapsed by default so the panel stays calm; the query only matters once opened.
// Loading shows skeleton rows (never a stale flash); saving disables every switch so
// a control never shows a value it isn't committing.
export const NotificationPreferences = () => {
  const { t } = useTranslation('notification');
  const reduce = useReducedMotion();
  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;

  const [open, setOpen] = useState(false);
  const { data: prefs, isLoading } = useGetPreferencesQuery(undefined, { skip: !open });
  const [updatePreferences, { isLoading: isSaving }] = useUpdatePreferencesMutation();

  const onToggle = (key: FamilyKey, next: boolean) => {
    updatePreferences({ [key]: next });
  };

  const onLockedClick = () => {
    toast(t('push.upgradeTitle'), {
      description: (
        <span className="text-muted-foreground">
          {t('prefs.upgradeBody')}{' '}
          <Link to="/profile" className="font-medium text-primary underline-offset-2 hover:underline">
            {t('push.upgradeCta')}
          </Link>
        </span>
      ),
    });
  };

  return (
    <div className="border-t border-border/60">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="prefs-disclosure"
      >
        <SlidersHorizontal aria-hidden className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-start">{t('prefs.title')}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
            data-testid="prefs-panel"
          >
            {isLoading ? (
              <div className="space-y-2 px-3 pb-2" data-testid="prefs-skeleton">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2.5 py-1">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3.5 flex-1" />
                    <Skeleton className="h-5 w-9 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="pb-1">
                {FAMILY_META.map(f => {
                  const locked = f.pro && !isPro;
                  return (
                    <PreferenceRow
                      key={f.key}
                      icon={f.icon}
                      label={t(f.labelKey)}
                      checked={prefs?.[f.key] ?? true}
                      disabled={isSaving}
                      locked={locked}
                      onChange={next => onToggle(f.key, next)}
                      onLockedClick={onLockedClick}
                      testId={f.testId}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
