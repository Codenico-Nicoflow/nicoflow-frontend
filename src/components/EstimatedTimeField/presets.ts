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

/** Format an off-chip value for display inside the Custom chip label. */
export const formatCustomLabel = (minutes: number, minSuffix: string, hourSuffix: string): string =>
  minutes % 60 === 0 ? `${minutes / 60}${hourSuffix}` : `${minutes}${minSuffix}`;
