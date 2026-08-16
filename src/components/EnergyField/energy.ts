import { TaskEnergy } from '@nicoflow/shared/types';
import { BatteryLow, BatteryMedium, Brain } from 'lucide-react';

// The three energy segments, in ascending focus-cost order. Each carries a
// small glyph, the i18n key for its label, and a Tailwind text-color class for
// the glyph (green→amber→violet as focus-cost climbs). Shared by EnergyField and
// the TaskItem energy glyph so the mapping lives in one place. Left un-annotated
// so the literal labelKey types satisfy the type-safe `t()` key union.
export const ENERGY_OPTIONS = [
  { value: TaskEnergy.LOW, icon: BatteryLow, labelKey: 'task:energy.low', colorClass: 'text-emerald-500' },
  { value: TaskEnergy.MEDIUM, icon: BatteryMedium, labelKey: 'task:energy.medium', colorClass: 'text-amber-500' },
  { value: TaskEnergy.DEEP, icon: Brain, labelKey: 'task:energy.deep', colorClass: 'text-violet-500' },
] as const;

export type EnergyOption = (typeof ENERGY_OPTIONS)[number];

export const DEFAULT_ENERGY: TaskEnergy = TaskEnergy.MEDIUM;
