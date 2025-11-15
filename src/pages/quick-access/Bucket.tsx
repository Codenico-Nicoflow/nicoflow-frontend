import { useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import { Archive, CheckCircle2, Inbox, StickyNote, Trash2 } from 'lucide-react';

import { AnimatedListItem } from '@/components';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItemCard } from '@/components/ui/list-item-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BucketDeleteDialog from '@/features/bucket/components/BucketDeleteDialog';
import BucketEditDialog from '@/features/bucket/components/BucketEditDialog';
import BucketList from '@/features/bucket/components/BucketList';
import BucketProcessDialog from '@/features/bucket/components/BucketProcessDialog';
import BucketQuickInput from '@/features/bucket/components/BucketQuickInput';
import { useGetBucketsQuery } from '@/lib/store';
import { type IBucket, ProcessingResult } from '@/lib/types';
import { cn } from '@/lib/utils';

const Bucket = () => {
  const { data: buckets = [], isLoading } = useGetBucketsQuery();
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox');

  // Dialog states
  const [processDialogBucket, setProcessDialogBucket] = useState<IBucket | null>(null);
  const [editDialogBucket, setEditDialogBucket] = useState<IBucket | null>(null);
  const [deleteDialogBucketId, setDeleteDialogBucketId] = useState<number | null>(null);

  // Filter buckets by processed status
  const inboxBuckets = useMemo(
    () =>
      buckets
        .filter(b => !b.processedAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [buckets]
  );

  const archivedBuckets = useMemo(
    () =>
      buckets
        .filter(b => b.processedAt)
        .sort((a, b) => new Date(b.processedAt!).getTime() - new Date(a.processedAt!).getTime()),
    [buckets]
  );

  const handleProcess = (bucket: IBucket) => {
    setProcessDialogBucket(bucket);
  };

  const handleEdit = (bucket: IBucket) => {
    setEditDialogBucket(bucket);
  };

  const handleDelete = (bucketId: number) => {
    setDeleteDialogBucketId(bucketId);
  };

  const getProcessingResultBadge = (bucket: IBucket) => {
    if (!bucket.processingResult) return null;

    const variants: Record<ProcessingResult, { icon: React.ReactNode; label: string; className: string }> = {
      [ProcessingResult.TASK]: {
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
        label: 'Task',
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      },
      [ProcessingResult.NOTE]: {
        icon: <StickyNote className="h-3 w-3 mr-1" />,
        label: 'Note',
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      },
      [ProcessingResult.SOMEDAY]: {
        icon: <Archive className="h-3 w-3 mr-1" />,
        label: 'Someday',
        className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
      },
      [ProcessingResult.TRASH]: {
        icon: <Trash2 className="h-3 w-3 mr-1" />,
        label: 'Trash',
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
      },
    };

    const variant = variants[bucket.processingResult] || variants[ProcessingResult.TASK];
    return (
      <Badge variant="outline" className={cn('text-xs flex items-center', variant.className)}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Inbox className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bucket</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Capture and process your thoughts</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Input - Sticky on scroll */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 sm:-mx-0 sm:px-0"
      >
        <Card className="p-3 sm:p-4 shadow-md">
          <BucketQuickInput />
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'inbox' | 'archived')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="inbox" className="relative">
              Inbox
              {inboxBuckets.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                  {inboxBuckets.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="relative">
              Archived
              {archivedBuckets.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                  {archivedBuckets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-0">
            <BucketList
              buckets={inboxBuckets}
              isLoading={isLoading}
              onProcess={handleProcess}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="archived" className="mt-0">
            {archivedBuckets.length === 0 ? (
              <EmptyState
                icon={Archive}
                title="No archived items"
                description="Processed bucket items will appear here for your reference."
              />
            ) : (
              <div className="space-y-3">
                {archivedBuckets.map((bucket, index) => (
                  <AnimatedListItem key={bucket.id} index={index}>
                    <ListItemCard variant="default" borderColor="muted">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">{getProcessingResultBadge(bucket)}</div>
                          <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">
                            {bucket.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Processed {new Date(bucket.processedAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </ListItemCard>
                  </AnimatedListItem>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialogs */}
      <BucketProcessDialog
        bucket={processDialogBucket}
        open={!!processDialogBucket}
        onOpenChange={open => !open && setProcessDialogBucket(null)}
      />
      <BucketEditDialog
        bucket={editDialogBucket}
        open={!!editDialogBucket}
        onOpenChange={open => !open && setEditDialogBucket(null)}
      />
      <BucketDeleteDialog
        bucketId={deleteDialogBucketId}
        open={!!deleteDialogBucketId}
        onOpenChange={open => !open && setDeleteDialogBucketId(null)}
      />
    </div>
  );
};

export default Bucket;
