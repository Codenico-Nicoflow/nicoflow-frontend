import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { formatMegabytes, STORAGE_LIMIT_BYTES, storageLevel, usageRatio } from './storage';

interface StorageBarProps {
  usedBytes?: number;
  limitBytes?: number;
  isLoading?: boolean;
}

// Fill colour per usage band — green ok / amber warning / red critical.
const FILL_CLASS: Record<ReturnType<typeof storageLevel>, string> = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

/**
 * Pro-only storage meter. Shows the account-wide usage from GET /attachments/usage
 * as "X.X MB of 100 MB" over a coloured bar (green < 75%, amber 75–95%, red ≥ 95%).
 * The figure must come from the server: the cap spans every owner, so summing the
 * open task's list would read near-empty while the account is full.
 * Gated by the caller — never rendered for free/downgraded users.
 */
export const StorageBar = ({ usedBytes, limitBytes, isLoading = false }: StorageBarProps) => {
  const { t } = useTranslation('task');

  if (isLoading || usedBytes === undefined) {
    return <Skeleton className="h-6 w-full" data-testid="storage-bar-skeleton" />;
  }

  const limit = limitBytes ?? STORAGE_LIMIT_BYTES;
  const ratio = usageRatio(usedBytes, limit);
  const level = storageLevel(ratio);
  const used = usedBytes;

  return (
    <div className="space-y-1" data-testid="storage-bar" data-level={level}>
      <p className="text-xs text-muted-foreground">
        {t('attachments.storageUsage', {
          used: formatMegabytes(used),
          total: `${Math.round(limit / (1024 * 1024))} MB`,
        })}
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('attachments.storageLabel')}
      >
        <div
          className={cn('h-full transition-[width]', FILL_CLASS[level])}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
};
