import { useState } from 'react';

import { Edit, Trash2, Zap } from 'lucide-react';

import { AnimatedListItem, ItemActionsMenu, ListItemCard, Timestamp } from '@/components';
import { ExpandableText } from '@/components/ui/expandable-text';
import { type IBucket } from '@/lib/types';

interface BucketItemProps {
  bucket: IBucket;
  index: number;
  onProcess: (bucket: IBucket) => void;
  onEdit: (bucket: IBucket) => void;
  onDelete: (bucketId: number) => void;
}

const BucketItem = ({ bucket, index, onProcess, onEdit, onDelete }: BucketItemProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const itemActions = [
    {
      label: 'Process',
      icon: Zap,
      onClick: () => onProcess(bucket),
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: () => onEdit(bucket),
    },
    {
      label: 'Delete',
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
        onClick={() => setMenuOpen(true)}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <ExpandableText maxLength={150}>{bucket.content}</ExpandableText>
            <Timestamp date={bucket.createdAt} />
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ">
            <ItemActionsMenu align="start" actions={itemActions} open={menuOpen} onOpenChange={setMenuOpen} />
          </div>
        </div>
      </ListItemCard>
    </AnimatedListItem>
  );
};

export default BucketItem;
