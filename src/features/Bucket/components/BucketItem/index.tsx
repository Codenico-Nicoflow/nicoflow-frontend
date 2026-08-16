import { useState } from 'react';

import { type IBucket } from '@nicoflow/shared/types';
import { Edit, Trash2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AnimatedListItem, ItemActionsMenu, ListItemCard, Timestamp } from '@/components';
import { ExpandableText } from '@/components/ui/expandable-text.tsx';

interface BucketItemProps {
  bucket: IBucket;
  index: number;
  onProcess: (bucket: IBucket) => void;
  onEdit: (bucket: IBucket) => void;
  onDelete: (bucketId: string) => void;
}

export const BucketItem = ({ bucket, index, onProcess, onEdit, onDelete }: BucketItemProps) => {
  const { t } = useTranslation('bucket');
  const [menuOpen, setMenuOpen] = useState(false);
  const itemActions = [
    {
      label: t('actions.process'),
      icon: Zap,
      onClick: () => onProcess(bucket),
    },
    {
      label: t('actions.edit'),
      icon: Edit,
      onClick: () => onEdit(bucket),
    },
    {
      label: t('actions.delete'),
      icon: Trash2,
      onClick: () => onDelete(bucket.id),
      destructive: true,
    },
  ];

  return (
    <AnimatedListItem index={index}>
      <ListItemCard
        variant="default"
        borderColor="primary"
        className="cursor-pointer"
        data-testid="bucket-item"
        data-bucket-content={bucket.content}
        onClick={() => setMenuOpen(true)}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <ExpandableText maxLength={150}>{bucket.content}</ExpandableText>
            <Timestamp date={bucket.createdAt} />
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ">
            <ItemActionsMenu
              align="start"
              actions={itemActions}
              open={menuOpen}
              onOpenChange={setMenuOpen}
              data-testid="bucket-item-actions"
            />
          </div>
        </div>
      </ListItemCard>
    </AnimatedListItem>
  );
};
