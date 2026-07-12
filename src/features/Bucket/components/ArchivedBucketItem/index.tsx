import { CheckSquare, FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AnimatedListItem, ListItemCard, Timestamp } from '@/components';
import { Badge } from '@/components/ui/badge.tsx';
import { ExpandableText } from '@/components/ui/expandable-text.tsx';
import { type IBucket, ProcessingResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ArchivedBucketItemProps {
  bucket: IBucket;
  index: number;
}

const RESULT_META = {
  [ProcessingResult.TASK]: {
    icon: CheckSquare,
    labelKey: 'page.result.task',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderColor: 'success',
  },
  [ProcessingResult.NOTE]: {
    icon: FileText,
    labelKey: 'page.result.note',
    badge: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
    borderColor: 'primary',
  },
  [ProcessingResult.TRASH]: {
    icon: Trash2,
    labelKey: 'page.result.trash',
    badge: 'border-muted-foreground/25 bg-muted text-muted-foreground',
    borderColor: 'muted',
  },
} as const;

export const ArchivedBucketItem = ({ bucket, index }: ArchivedBucketItemProps) => {
  const { t } = useTranslation('bucket');
  const meta = RESULT_META[bucket.processingResult ?? ProcessingResult.TRASH];
  const Icon = meta.icon;

  return (
    <AnimatedListItem index={index}>
      <ListItemCard variant="comfortable" borderColor={meta.borderColor} className="bg-muted/40">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <ExpandableText maxLength={150}>{bucket.content}</ExpandableText>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t('page.processedTimestamp')}</span>
              <Timestamp date={bucket.processedAt ?? bucket.updatedAt} />
            </div>
          </div>
          <Badge variant="outline" className={cn('flex-shrink-0 gap-1', meta.badge)}>
            <Icon className="h-3 w-3" />
            {t(meta.labelKey)}
          </Badge>
        </div>
      </ListItemCard>
    </AnimatedListItem>
  );
};
