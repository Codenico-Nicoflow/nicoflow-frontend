export interface TimePreset {
  minutes: number;
}

export const TIME_PRESETS: TimePreset[] = [
  { minutes: 15 },
  { minutes: 30 },
  { minutes: 60 },
  { minutes: 120 },
  { minutes: 240 },
  { minutes: 480 },
];

export const PRESET_VALUES = new Set(TIME_PRESETS.map(p => p.minutes));

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 1440;

export const isPresetValue = (v: number | null | undefined): boolean => v != null && PRESET_VALUES.has(v);

/**
 * Humanize a minute count for display: whole hours as "2h", sub-hour as
 * "45min", and mixed as "1h 30min". Single source for every duration chip/badge.
 */
export const formatDuration = (minutes: number, minSuffix: string, hourSuffix: string): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}${minSuffix}`;
  if (mins === 0) return `${hours}${hourSuffix}`;
  return `${hours}${hourSuffix} ${mins}${minSuffix}`;
};

/** Format an off-chip value for display inside the Custom chip label. */
export const formatCustomLabel = (minutes: number, minSuffix: string, hourSuffix: string): string =>
  formatDuration(minutes, minSuffix, hourSuffix);
