import { useTranslation } from 'react-i18next';

import type { IAttachment } from '@/lib/types';
import { cn } from '@/lib/utils';

import { formatMegabytes, STORAGE_LIMIT_BYTES, storageLevel, sumBytes, usageRatio } from './storage';

interface StorageBarProps {
  attachments: IAttachment[];
}

// Fill colour per usage band — green ok / amber warning / red critical.
const FILL_CLASS: Record<ReturnType<typeof storageLevel>, string> = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

/**
 * Pro-only storage meter. Sums the current owner's attachment sizes client-side
 * and shows "X.X MB of 100 MB" over a coloured bar (green < 75%, amber 75–95%,
 * red ≥ 95%). Gated by the caller — never rendered for free/downgraded users.
 */
export const StorageBar = ({ attachments }: StorageBarProps) => {
  const { t } = useTranslation('task');
  const used = sumBytes(attachments);
  const ratio = usageRatio(used);
  const level = storageLevel(ratio);

  return (
    <div className="space-y-1" data-testid="storage-bar" data-level={level}>
      <p className="text-xs text-muted-foreground">
        {t('attachments.storageUsage', {
          used: formatMegabytes(used),
          total: `${STORAGE_LIMIT_BYTES / (1024 * 1024)} MB`,
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
