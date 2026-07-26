import { FileArchive, FileImage, FileSpreadsheet, FileText, FileType, type LucideIcon } from 'lucide-react';

// Maps a MIME type to the lucide icon shown on an attachment row. Buckets the
// backend allowlist into image / pdf / sheet / doc / archive / generic — the
// visual cue, not a security decision (that's the upload allowlist).
export const iconForMime = (mimeType: string): LucideIcon => {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf') return FileType;
  if (mimeType === 'application/zip') return FileArchive;
  if (mimeType.includes('spreadsheet') || mimeType === 'application/vnd.ms-excel' || mimeType === 'text/csv')
    return FileSpreadsheet;
  return FileText; // word docs, text/plain, and any generic fallback
};
