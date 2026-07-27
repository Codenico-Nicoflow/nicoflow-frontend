import { CalendarClock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

import type { QuotaStatus } from '../../quota';

export interface QuotaWallProps {
  quota: QuotaStatus;
}

// What replaces the composer once the quota is spent. Two distinct surfaces,
// because the two cases are not the same problem:
//
//   Free (lifetime cap) → an upsell. The block is liftable right now, so we lead
//     with the upgrade CTA (plan-limit → upsell pattern, matching ProGate).
//   Pro (monthly cap)   → a "resets next month" notice, NO CTA. There is nothing
//     to buy; an upgrade button here would be a dark pattern.
export const QuotaWall = ({ quota }: QuotaWallProps) => {
  const { t } = useTranslation('ai');

  if (!quota.canUpgrade) {
    return (
      <div
        className="flex flex-col items-center gap-1.5 border-t px-4 py-5 text-center"
        role="status"
        data-testid="ai-quota-reset-notice"
      >
        <CalendarClock className="size-5 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">{t('quota.proExhaustedTitle')}</p>
        <p className="text-xs text-muted-foreground">{t('quota.proExhaustedDescription')}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-2 border-t px-4 py-5 text-center"
      role="status"
      data-testid="ai-quota-wall"
    >
      <Sparkles className="size-5 text-primary" aria-hidden />
      <p className="text-sm font-medium text-foreground">{t('quota.freeExhaustedTitle')}</p>
      <p className="text-xs text-muted-foreground">{t('quota.freeExhaustedDescription', { limit: quota.limit })}</p>
      <Button asChild size="sm" data-testid="ai-quota-upgrade-cta">
        <Link to="/settings">{t('quota.upgrade')}</Link>
      </Button>
    </div>
  );
};
