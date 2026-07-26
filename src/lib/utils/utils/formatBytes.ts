// Human-readable byte size for attachment rows: 2048 → "2 KB", 1572864 → "1.5 MB".
// Binary (1024) units, one decimal for KB+ (trimmed when whole), none for bytes.
const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10;

  return `${rounded} ${UNITS[exponent]}`;
};
