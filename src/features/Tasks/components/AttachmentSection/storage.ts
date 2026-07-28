import type { IAttachment } from '@/lib/types';

// Per-user storage cap (SPEC §5): 100 MB across all attachments. The backend is
// the authority — it reports the live cap via GET /attachments/usage and enforces
// it on confirm (STORAGE_LIMIT_EXCEEDED). This constant is only the fallback used
// before that response lands.
export const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024;

// Colour thresholds for the bar: green under 75%, amber 75–95%, red at/above 95%.
export type StorageLevel = 'ok' | 'warning' | 'critical';

export const storageLevel = (ratio: number): StorageLevel => {
  if (ratio >= 0.95) return 'critical';
  if (ratio >= 0.75) return 'warning';
  return 'ok';
};

// Total bytes across a list of attachments. Owner-scoped — never the account
// total; use GET /attachments/usage for anything measured against the cap.
export const sumBytes = (attachments: IAttachment[]): number =>
  attachments.reduce((total, att) => total + att.fileSize, 0);

// Ratio 0..1 of used bytes against the cap, clamped so a bar never overflows.
export const usageRatio = (usedBytes: number, limitBytes: number = STORAGE_LIMIT_BYTES): number =>
  limitBytes > 0 ? Math.min(usedBytes / limitBytes, 1) : 0;

// "82.0 MB" — always one decimal in MB, for the "X.X MB of 100 MB" bar label.
// (formatBytes trims whole decimals + switches units; the bar wants a stable MB scale.)
export const formatMegabytes = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
