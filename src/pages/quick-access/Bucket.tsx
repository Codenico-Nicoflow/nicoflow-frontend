import { useMemo, useState } from 'react';

import { Archive, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { Badge } from '@/components/ui/badge.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import {
  ArchivedBucketItem,
  BucketDeleteDialog,
  BucketEditDialog,
  BucketList,
  BucketProcessDialog,
  BucketQuickInput,
} from '@/features/Bucket';
import { useGetBucketsQuery } from '@/lib/store';
import { type IBucket } from '@/lib/types';

const Bucket = () => {
  const { t } = useTranslation('bucket');
  const { data: buckets, isLoading } = useGetBucketsQuery();

  const [processing, setProcessing] = useState<IBucket | null>(null);
  const [editing, setEditing] = useState<IBucket | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { inbox, archived } = useMemo(() => {
    const items = buckets?.items ?? [];
    return {
      inbox: items.filter(b => !b.processedAt),
      archived: [...items]
        .filter(b => b.processedAt)
        .sort((a, b) => new Date(b.processedAt ?? 0).getTime() - new Date(a.processedAt ?? 0).getTime()),
    };
  }, [buckets]);

  const subtitle = isLoading
    ? ''
    : inbox.length === 0
      ? t('page.subtitleClear')
      : t('page.subtitle', { count: inbox.length });

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('page.heading')}</h1>
        {isLoading ? (
          <Skeleton className="mt-2 h-4 w-56" />
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </header>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="w-full sm:w-auto" data-testid="bucket-tabs">
          <TabsTrigger value="inbox" className="flex-1 gap-2 sm:flex-none" data-testid="bucket-tab-inbox">
            {t('page.tabs.inbox')}
            {!isLoading && inbox.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
                {inbox.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex-1 gap-2 sm:flex-none" data-testid="bucket-tab-archived">
            {t('page.tabs.archived')}
            {!isLoading && archived.length > 0 && (
              <Badge variant="outline" className="px-1.5 py-0 text-[11px]">
                {archived.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6 space-y-6" data-testid="bucket-inbox-panel">
          <section className="rounded-xl border bg-card/50 p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <h2 className="text-sm font-semibold leading-none text-foreground">{t('page.captureHeading')}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{t('page.captureHint')}</p>
              </div>
            </div>
            <BucketQuickInput />
          </section>

          <BucketList
            buckets={inbox}
            isLoading={isLoading}
            onProcess={setProcessing}
            onEdit={setEditing}
            onDelete={setDeletingId}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-6" data-testid="bucket-archived-panel">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : archived.length === 0 ? (
            <EmptyState
              icon={Archive}
              title={t('page.archived.emptyTitle')}
              description={t('page.archived.emptyDescription')}
            />
          ) : (
            <div className="space-y-3">
              {archived.map((bucket, index) => (
                <ArchivedBucketItem key={bucket.id} bucket={bucket} index={index} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BucketProcessDialog
        bucket={processing}
        open={!!processing}
        onOpenChange={open => !open && setProcessing(null)}
      />
      <BucketEditDialog bucket={editing} open={!!editing} onOpenChange={open => !open && setEditing(null)} />
      <BucketDeleteDialog
        bucketId={deletingId}
        open={!!deletingId}
        onOpenChange={open => !open && setDeletingId(null)}
      />
    </div>
  );
};

export default Bucket;
