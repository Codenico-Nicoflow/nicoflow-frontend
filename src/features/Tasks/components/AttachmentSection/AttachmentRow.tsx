import { useState } from 'react';

import { Download, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useDeleteAttachmentMutation, useGetDownloadUrlMutation } from '@/lib/store';
import type { IAttachment } from '@/lib/types';
import { formatBytes, showErrorToast } from '@/lib/utils';

import { iconForMime } from './attachmentIcon';

interface AttachmentRowProps {
  attachment: IAttachment;
}

/**
 * One confirmed attachment: type icon, name, formatted size, and two actions.
 * Download fetches a presigned URL (button spinner + disabled while fetching)
 * and opens it in a new tab — the server sets the forced-download disposition.
 * Delete is an honest hard delete: no undo affordance. Clicking Delete swaps the
 * trailing controls for an inline "Delete? [Cancel] [Delete]" confirm; confirming
 * shows a row spinner, hard-deletes, and toasts success (S3 delete is irreversible).
 */
export const AttachmentRow = ({ attachment }: AttachmentRowProps) => {
  const { t } = useTranslation('task');
  const [getDownloadUrl, { isLoading: isDownloading }] = useGetDownloadUrlMutation();
  const [deleteAttachment, { isLoading: isDeleting }] = useDeleteAttachmentMutation();
  const [confirming, setConfirming] = useState(false);

  const Icon = iconForMime(attachment.mimeType);

  const handleDownload = async () => {
    try {
      const { url } = await getDownloadUrl(attachment.id).unwrap();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAttachment({ id: attachment.id, ownerId: attachment.ownerId }).unwrap();
      toast.success(t('attachments.deleteSuccess', { name: attachment.fileName }));
      // Row leaves the DOM via the invalidated list query — no local removal needed.
    } catch (error) {
      showErrorToast(error, toast);
      setConfirming(false); // keep the row so the user can retry
    }
  };

  return (
    <li
      data-testid={`attachment-row-${attachment.id}`}
      className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm" title={attachment.fileName}>
        {attachment.fileName}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(attachment.fileSize)}</span>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-muted-foreground">{t('attachments.deleteConfirm')}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setConfirming(false)}
            disabled={isDeleting}
            data-testid={`attachment-delete-cancel-${attachment.id}`}
          >
            {t('attachments.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            data-testid={`attachment-delete-confirm-${attachment.id}`}
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('attachments.deleteAction')}
          </Button>
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => void handleDownload()}
            disabled={isDownloading}
            aria-label={t('attachments.download', { name: attachment.fileName })}
            data-testid={`attachment-download-${attachment.id}`}
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirming(true)}
            aria-label={t('attachments.delete', { name: attachment.fileName })}
            data-testid={`attachment-delete-${attachment.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </li>
  );
};
