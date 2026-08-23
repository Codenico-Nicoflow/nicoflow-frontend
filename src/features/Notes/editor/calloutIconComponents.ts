import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Flag, HelpCircle, Info, Lightbulb, Star, StickyNote } from 'lucide-react';

import type { NoteCalloutIcon } from './calloutIcons';

// Maps a stored icon NAME to the component that renders it — the DOM/JSON
// never carries a component reference, only the name from calloutIcons.ts,
// so this is the one place the two are joined.
export const CALLOUT_ICON_COMPONENTS: Record<NoteCalloutIcon, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  idea: Lightbulb,
  star: Star,
  note: StickyNote,
  flag: Flag,
  question: HelpCircle,
};
