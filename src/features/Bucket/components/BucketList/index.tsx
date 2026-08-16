import { type IBucket } from '@nicoflow/shared/types';
import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { Skeleton } from '@/components/ui/skeleton.tsx';

import { BucketItem } from '../BucketItem';

interface BucketListProps {
  buckets: IBucket[];
  isLoading: boolean;
  onProcess: (bucket: IBucket) => void;
  onEdit: (bucket: IBucket) => void;
  onDelete: (bucketId: string) => void;
}

export const BucketList = ({ buckets, isLoading, onProcess, onEdit, onDelete }: BucketListProps) => {
  const { t } = useTranslation('bucket');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (buckets.length === 0) {
    return <EmptyState icon={Inbox} title={t('list.emptyTitle')} description={t('list.emptyDescription')} />;
  }

  return (
    <div className="space-y-3">
      {buckets.map((bucket, index) => (
        <BucketItem
          key={bucket.id}
          bucket={bucket}
          index={index}
          onProcess={onProcess}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
