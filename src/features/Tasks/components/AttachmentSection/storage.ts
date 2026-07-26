import type { IAttachment } from '@/lib/types';

// Per-user storage cap (SPEC §5): 100 MB across all attachments. The backend is
// the authority (STORAGE_LIMIT_EXCEEDED on confirm); this drives the Pro storage
// bar from the client-summed list, so it reflects only the current owner's files
// — an approximation of the account total, good enough for the "how full am I" cue.
export const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024;

// Colour thresholds for the bar: green under 75%, amber 75–95%, red at/above 95%.
export type StorageLevel = 'ok' | 'warning' | 'critical';

export const storageLevel = (ratio: number): StorageLevel => {
  if (ratio >= 0.95) return 'critical';
  if (ratio >= 0.75) return 'warning';
  return 'ok';
};

// Total bytes across a list of attachments.
export const sumBytes = (attachments: IAttachment[]): number =>
  attachments.reduce((total, att) => total + att.fileSize, 0);

// Ratio 0..1 of used bytes against the cap, clamped so a bar never overflows.
export const usageRatio = (usedBytes: number): number => Math.min(usedBytes / STORAGE_LIMIT_BYTES, 1);

// "82.0 MB" — always one decimal in MB, for the "X.X MB of 100 MB" bar label.
// (formatBytes trims whole decimals + switches units; the bar wants a stable MB scale.)
export const formatMegabytes = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
