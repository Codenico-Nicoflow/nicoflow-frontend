import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { QuotaStatus } from '../../quota';

export interface QuotaIndicatorProps {
  // Derived quota, or undefined while the usage query is in flight / failed.
  quota: QuotaStatus | undefined;
  isLoading?: boolean;
}

// The quota footer: "X / 500 this month" (Pro) or "X / 5 free messages" (Free),
// with a thin meter that turns destructive once the cap is hit. Purely presentational
// — the caller owns the usage read and passes a derived status, which keeps this
// renderable from Storybook and from tests without a store.
export const QuotaIndicator = ({ quota, isLoading = false }: QuotaIndicatorProps) => {
  const { t } = useTranslation('ai');

  // No skeleton flash once we have data; a failed usage read renders nothing
  // rather than a misleading "0 / 0".
  if (isLoading) return <Skeleton className="mx-3 my-2 h-4 w-32" data-testid="ai-quota-loading" />;
  if (!quota) return null;

  const { used, limit, scope, state } = quota;
  const exhausted = state === 'exhausted';
  const label = scope === 'lifetime' ? t('quota.freeLabel', { used, limit }) : t('quota.proLabel', { used, limit });

  return (
    <div className="border-t px-3 py-2" data-testid="ai-quota-indicator" data-quota-state={state}>
      <div
        className={cn(
          'flex items-center justify-between text-xs',
          exhausted ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        <span data-testid="ai-quota-label">{label}</span>
      </div>
      <div
        className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full transition-[width]', exhausted ? 'bg-destructive' : 'bg-primary')}
          style={{ width: `${quota.percent}%` }}
        />
      </div>
    </div>
  );
};
