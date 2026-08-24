import { useCallback } from 'react';

import { USER_STATUS, validateAttachmentFile } from '@nicoflow/shared/types';
import { FileText, Paperclip, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { OptionalBadge } from '@/components/OptionalBadge';
import { Button } from '@/components/ui/button';
import { useAppUser } from '@/lib/store';

import { ProGate } from './ProGate';
import { UploadZone } from './UploadZone';

// Same per-owner cap the confirmed list enforces server-side (SPEC §5) — staged
// files count toward it too so create mode can't queue up more than a task will
// ever be allowed to hold.
const MAX_ATTACHMENTS_PER_OWNER = 20;

interface StagedAttachmentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
}

/**
 * Create-mode counterpart to AttachmentSection: no ownerId exists yet, so this
 * only collects validated File[] in the caller's state. TaskDialog uploads them
 * for real once the task is created. Free/downgraded users see the same ProGate
 * as edit mode — the picker itself never mounts for them, so nothing can be staged.
 */
export const StagedAttachmentPicker = ({ files, onChange }: StagedAttachmentPickerProps) => {
  const { t } = useTranslation('task');
  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;

  const handleFiles = useCallback(
    (incoming: File[]) => {
      if (!isPro) return; // UI-gated already; guard the drop path too
      const remaining = MAX_ATTACHMENTS_PER_OWNER - files.length;
      if (incoming.length > remaining) {
        toast.error(t('attachments.countCap'));
      }

      const accepted = incoming.slice(0, Math.max(remaining, 0));
      const valid: File[] = [];
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
        valid.push(file);
      }
      if (valid.length > 0) onChange([...files, ...valid]);
    },
    [isPro, files, onChange, t]
  );

  const removeFile = useCallback(
    (index: number) => {
      onChange(files.filter((_, i) => i !== index));
    },
    [files, onChange]
  );

  const atCap = files.length >= MAX_ATTACHMENTS_PER_OWNER;

  return (
    <div className="space-y-3" data-testid="staged-attachment-picker">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" aria-hidden />
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          {t('attachments.title')}
          <OptionalBadge />
        </p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              data-testid={`staged-file-${index}`}
              className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm" title={file.name}>
                {file.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeFile(index)}
                aria-label={t('attachments.remove')}
                data-testid={`staged-file-remove-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {isPro ? (
        <>
          <UploadZone onFiles={handleFiles} disabled={atCap} />
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
