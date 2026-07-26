import { useRef, useState } from 'react';

import { Paperclip, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * A drag-and-drop + click file picker. Purely presentational: it collects
 * File[] from either a drop or the hidden <input> and hands them to `onFiles`;
 * all validation and the upload flow live in AttachmentSection. Keyboard-
 * operable (the button forwards to the input) and labelled for a11y.
 */
export const UploadZone = ({ onFiles, disabled = false }: UploadZoneProps) => {
  const { t } = useTranslation('task');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const emit = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    emit(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      data-testid="upload-zone"
      data-drag-active={dragActive}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragActive(false)}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 px-4 py-6 text-center transition-colors',
        dragActive && 'border-primary bg-primary/5',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <Upload className={cn('h-5 w-5 text-muted-foreground', dragActive && 'text-primary')} aria-hidden />
      <p className="text-sm text-muted-foreground">
        {dragActive ? t('attachments.dropActive') : t('attachments.dropHint')}
      </p>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={openPicker}
        disabled={disabled}
        data-testid="upload-zone-button"
      >
        <Paperclip className="h-4 w-4" />
        {t('attachments.addButton')}
      </Button>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        data-testid="upload-zone-input"
        aria-label={t('attachments.addButton')}
        onChange={e => {
          emit(e.target.files);
          e.target.value = ''; // allow re-picking the same file
        }}
      />
    </div>
  );
};
