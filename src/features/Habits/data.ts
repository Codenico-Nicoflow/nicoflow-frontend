import {
  Activity,
  Apple,
  BookOpen,
  Brain,
  CandyOff,
  CigaretteOff,
  Circle,
  Code,
  Dumbbell,
  Footprints,
  GlassWater,
  GraduationCap,
  Heart,
  Languages,
  type LucideIcon,
  Moon,
  Music,
  PenLine,
  PiggyBank,
  Smartphone,
  Sparkles,
  TreePine,
  WineOff,
} from 'lucide-react';

// Subject → icon.
//
// These are Lucide components rather than the app's `IconId` allowlist: that
// list is the curated project/area vocabulary (folder, briefcase, rocket…) and
// has nothing to say about reading or quitting sugar. Forcing habit subjects
// through it would mean picking the least-wrong folder icon for every subject.
//
// v1 renders these icons; v2 swaps in commissioned artwork. Because the slug is
// the stable contract and this map is the only thing that reads it, that swap is
// pure asset work — no migration, no contract change.
//
// The catalog is SERVED, so this map can legitimately be missing a slug an older
// build has never seen. Every lookup falls back rather than rendering blank.
export const HABIT_SUBJECT_ICONS: Record<string, LucideIcon> = {
  reading: BookOpen,
  exercise: Dumbbell,
  running: Footprints,
  walking: TreePine,
  stretching: Activity,
  meditation: Brain,
  hydration: GlassWater,
  nutrition: Apple,
  sleep: Moon,
  journaling: PenLine,
  gratitude: Heart,
  study: GraduationCap,
  language: Languages,
  coding: Code,
  music: Music,
  savings: PiggyBank,
  tidying: Sparkles,
  screen_time: Smartphone,
  quit_smoking: CigaretteOff,
  quit_drinking: WineOff,
  quit_sugar: CandyOff,
  custom: Circle,
};

export const HABIT_FALLBACK_ICON: LucideIcon = Circle;

// Grid breakpoints, mirroring ribbonWindowSize: one column on a phone, two on a
// tablet, three on a desktop. The ribbon narrows with the column rather than
// compressing its cells.
export const HABIT_GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
