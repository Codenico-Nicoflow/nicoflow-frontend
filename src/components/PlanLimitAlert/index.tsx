import { Sparkles, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export const PLAN_LIMIT_ALERT_TESTID = 'plan-limit-alert';

interface PlanLimitAlertProps {
  /** Optional override for the description copy (e.g. a resource-specific message). */
  message?: string;
}

export const PlanLimitAlert = ({ message }: PlanLimitAlertProps) => {
  const { t } = useTranslation('common');

  return (
    <div
      data-testid={PLAN_LIMIT_ALERT_TESTID}
      className="relative overflow-hidden rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-500/30 dark:from-amber-950/40 dark:to-orange-950/30"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-amber-900 dark:text-amber-100">{t('planLimit.title')}</p>
          <p className="text-sm text-amber-800/80 dark:text-amber-200/70">{message ?? t('planLimit.description')}</p>
          <Button
            asChild
            size="sm"
            className="bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400"
          >
            {/* TODO: point at billing page (E-030) */}
            <Link to="/profile">
              <Zap className="h-4 w-4" />
              {t('planLimit.cta')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
