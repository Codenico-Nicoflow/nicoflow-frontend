// Client-side attachment guardrails — a mirror of the backend allowlist
// (internal/domain/attachment/types.go) and its 20 MB cap. These pre-empt a
// doomed upload before it hits the presigned-POST policy; the backend re-checks
// via HeadObject, so this is a UX gate, not the security boundary. No SVG (it can
// carry script).

export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024; // 20 MB — matches maxUploadBytes

// The exact MIME set the backend accepts. Kept as a readonly tuple so
// AttachmentMimeType stays a narrow union, not string.
export const ATTACHMENT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export type AttachmentMimeType = (typeof ATTACHMENT_ALLOWED_MIME_TYPES)[number];

const allowedMimeSet = new Set<string>(ATTACHMENT_ALLOWED_MIME_TYPES);

export const isAllowedAttachmentMime = (mimeType: string): mimeType is AttachmentMimeType =>
  allowedMimeSet.has(mimeType);

export const isAllowedAttachmentSize = (bytes: number): boolean => bytes > 0 && bytes <= ATTACHMENT_MAX_BYTES;

export type AttachmentValidationError = 'MIME_NOT_ALLOWED' | 'SIZE_EXCEEDED' | 'EMPTY_FILE';

// Validates a file against the allowlist + cap, returning the first failure or
// null when it's uploadable. Order matters: empty is reported before size so a
// 0-byte file reads as EMPTY_FILE, not SIZE_EXCEEDED.
export const validateAttachmentFile = (file: File): AttachmentValidationError | null => {
  if (!isAllowedAttachmentMime(file.type)) return 'MIME_NOT_ALLOWED';
  if (file.size <= 0) return 'EMPTY_FILE';
  if (file.size > ATTACHMENT_MAX_BYTES) return 'SIZE_EXCEEDED';
  return null;
};
