import { Inbox } from 'lucide-react';

import { EmptyState } from '@/components';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { type IBucket } from '@/lib/types';

import { BucketItem } from '../BucketItem';

interface BucketListProps {
  buckets: IBucket[];
  isLoading: boolean;
  onProcess: (bucket: IBucket) => void;
  onEdit: (bucket: IBucket) => void;
  onDelete: (bucketId: number) => void;
}

export const BucketList = ({ buckets, isLoading, onProcess, onEdit, onDelete }: BucketListProps) => {
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
    return (
      <EmptyState
        icon={Inbox}
        title="Your bucket is empty"
        description="Capture anything on your mind using the quick input above. Process it later into tasks, notes, or ideas."
      />
    );
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
