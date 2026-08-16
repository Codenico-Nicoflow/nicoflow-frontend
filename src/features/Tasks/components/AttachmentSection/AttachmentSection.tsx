import { useCallback, useState } from 'react';

import type { AttachmentOwnerType } from '@nicoflow/shared/types';
import { USER_STATUS, validateAttachmentFile } from '@nicoflow/shared/types';
import { FileText, Loader2, Paperclip, RotateCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAppUser,
  useConfirmAttachmentMutation,
  useGetAttachmentsQuery,
  useGetStorageUsageQuery,
  useGetUploadUrlMutation,
} from '@/lib/store';
import { getApiErrorCode, showErrorToast, uploadToS3 } from '@/lib/utils';

import { AttachmentRow } from './AttachmentRow';
import { ProGate } from './ProGate';
import { StorageBar } from './StorageBar';
import { UploadZone } from './UploadZone';

// Pro count cap — a task holds at most 20 attachments (SPEC §5). The backend is
// the authority (PLAN_LIMIT_EXCEEDED on the count), this pre-empts the obvious case.
const MAX_ATTACHMENTS_PER_OWNER = 20;

// How many skeleton rows to show while the list loads (no empty-flash / stale-flash).
const SKELETON_ROWS = 3;

// One in-flight upload. `id` is a client-only key (crypto.randomUUID) — the
// server id only exists after confirm, at which point the row leaves this list
// and reappears via the invalidated attachments query.
type UploadItem = {
  id: string;
  file: File;
  progress: number; // 0..1
  status: 'uploading' | 'error';
};

interface AttachmentSectionProps {
  ownerType: AttachmentOwnerType;
  ownerId: string;
}

/**
 * Owner-parameterised attachment panel hosted in TaskDialog. Lists confirmed
 * attachments (AttachmentRow: icon, name, size, download, honest delete), shows a
 * Pro storage bar, and drives the presigned-POST upload flow — validate →
 * upload-url → S3 POST (XHR progress) → confirm. Free/downgraded users still see,
 * download, and delete existing files; only the upload path is Pro-gated (ProGate).
 */
export const AttachmentSection = ({ ownerType, ownerId }: AttachmentSectionProps) => {
  const { t } = useTranslation('task');
  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;

  const { data: attachments = [], isLoading } = useGetAttachmentsQuery({ ownerType, ownerId });
  // Account-wide usage — only Pro sees the bar, so don't fetch it otherwise.
  const { data: storageUsage, isLoading: isUsageLoading } = useGetStorageUsageQuery(undefined, { skip: !isPro });
  const [getUploadUrl] = useGetUploadUrlMutation();
  const [confirmAttachment] = useConfirmAttachmentMutation();

  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const patchUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads(prev => prev.map(u => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  // Runs the full flow for one already-validated file. On success the item is
  // dropped (the confirmed row arrives via the invalidated list query); on
  // failure it's left in `error` state carrying a retryable message key.
  const runUpload = useCallback(
    async (item: UploadItem) => {
      const { id, file } = item;
      try {
        const { url, headers, s3Key } = await getUploadUrl({
          ownerType,
          ownerId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }).unwrap();

        await uploadToS3({
          url,
          headers,
          file,
          onProgress: ({ ratio }) => patchUpload(id, { progress: ratio }),
        });

        await confirmAttachment({ s3Key, fileName: file.name }).unwrap();
        removeUpload(id); // confirmed → the list refetch renders it
      } catch (error) {
        // STORAGE_LIMIT_EXCEEDED / PLAN_LIMIT_EXCEEDED surface as a toast; the row
        // stays in `error` state carrying a retry.
        const code = getApiErrorCode(error);
        if (code === 'STORAGE_LIMIT_EXCEEDED' || code === 'PLAN_LIMIT_EXCEEDED') {
          showErrorToast(error, toast);
        }
        patchUpload(id, { status: 'error' });
      }
    },
    [ownerType, ownerId, getUploadUrl, confirmAttachment, removeUpload, patchUpload]
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      if (!isPro) return; // UI-gated already; guard the drop path too
      const remaining = MAX_ATTACHMENTS_PER_OWNER - attachments.length - uploads.length;
      if (files.length > remaining) {
        toast.error(t('attachments.countCap'));
      }

      const accepted = files.slice(0, Math.max(remaining, 0));
      for (const file of accepted) {
        const failure = validateAttachmentFile(file);
        if (failure) {
          const key =
            failure === 'MIME_NOT_ALLOWED'
              ? 'attachments.invalidType'
              : failure === 'EMPTY_FILE'
                ? 'attachments.emptyFile'
                : 'attachments.tooLarge';
          toast.error(t(key, { name: file.name }));
          continue;
        }
        const item: UploadItem = { id: crypto.randomUUID(), file, progress: 0, status: 'uploading' };
        setUploads(prev => [...prev, item]);
        void runUpload(item);
      }
    },
    [isPro, attachments.length, uploads.length, runUpload, t]
  );

  const handleRetry = useCallback(
    (id: string) => {
      setUploads(prev => {
        const item = prev.find(u => u.id === id);
        if (item) void runUpload({ ...item, progress: 0, status: 'uploading' });
        return prev.map(u => (u.id === id ? { ...u, progress: 0, status: 'uploading' } : u));
      });
    },
    [runUpload]
  );

  const atCap = attachments.length + uploads.length >= MAX_ATTACHMENTS_PER_OWNER;
  const uploadDisabled = atCap;
  const showEmpty = !isLoading && attachments.length === 0 && uploads.length === 0;

  return (
    <div className="space-y-3" data-testid="attachment-section">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" aria-hidden />
        <p className="text-sm font-semibold text-foreground">{t('attachments.title')}</p>
      </div>

      {isPro && (
        <StorageBar
          usedBytes={storageUsage?.usedBytes}
          limitBytes={storageUsage?.limitBytes}
          isLoading={isUsageLoading}
        />
      )}

      {isLoading && (
        <ul className="space-y-1" data-testid="attachment-skeleton">
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5">
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12 shrink-0" />
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <p className="text-sm text-muted-foreground" data-testid="attachment-empty">
          {t('attachments.empty')}
        </p>
      )}

      {!isLoading && (attachments.length > 0 || uploads.length > 0) && (
        <ul className="space-y-1">
          {attachments.map(att => (
            <AttachmentRow key={att.id} attachment={att} />
          ))}

          {uploads.map(item => (
            <li
              key={item.id}
              data-testid={`upload-item-${item.id}`}
              className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5"
            >
              {item.status === 'uploading' ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm" title={item.file.name}>
                  {item.file.name}
                </span>
                {item.status === 'uploading' ? (
                  <div
                    className="mt-1 h-1 w-full overflow-hidden rounded bg-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(item.progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('attachments.uploading')}
                    data-testid={`upload-progress-${item.id}`}
                  >
                    <div
                      className="h-full bg-primary transition-[width]"
                      style={{ width: `${Math.round(item.progress * 100)}%` }}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-destructive" data-testid={`upload-error-${item.id}`}>
                    {t('attachments.uploadFailed', { name: item.file.name })}
                  </span>
                )}
              </div>
              {item.status === 'error' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleRetry(item.id)}
                  aria-label={t('attachments.retry')}
                  data-testid={`upload-retry-${item.id}`}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeUpload(item.id)}
                aria-label={t('attachments.remove')}
                data-testid={`upload-remove-${item.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {isPro ? (
        <>
          <UploadZone onFiles={handleFiles} disabled={uploadDisabled} />
          <p className="text-xs text-muted-foreground" data-testid="attachment-hint">
            {t('attachments.hint')}
          </p>
        </>
      ) : (
        <ProGate />
      )}
    </div>
  );
};
