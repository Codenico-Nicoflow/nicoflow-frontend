import { Bot, CalendarDays, Inbox, LayoutGrid, type LucideIcon, Settings, Sun, Target } from 'lucide-react';

import type { Resources } from '@/lib/i18n/locales/en';

/** Keys available in the `nav` i18n namespace — keeps labelKey type-safe. */
type NavKey = keyof Resources['nav'];

export interface NavDestination {
  /** Stable id used for testids and keys — never localized. */
  id: string;
  /** Key into the `nav` i18n namespace; resolved to the visible/aria label at render. */
  labelKey: NavKey;
  icon: LucideIcon;
  to: string;
  /** Prefix used for active-state matching (e.g. Areas stays active on /projects/:id). */
  match: string[];
  /** Pro-gated destination. It still renders and still navigates — the page owns
   *  the locked experience — this only drives the lock affordance. */
  proOnly?: boolean;
  /** Gets its own cell in the mobile BottomNav. Non-primary destinations move
   *  into the More sheet; the Rail ignores this and renders all six flat. */
  primary: boolean;
}

// Primary destinations, shared by the desktop Rail and the mobile BottomNav.
// Order is the render order in both: the four `primary` ones fill the phone bar.
export const NAV_DESTINATIONS: NavDestination[] = [
  // Inbox first — capture is the entry point of the GTD flow.
  {
    id: 'inbox',
    labelKey: 'inbox',
    icon: Inbox,
    to: '/quick-access/bucket',
    match: ['/quick-access/bucket'],
    primary: true,
  },
  {
    id: 'today',
    labelKey: 'timeSpread',
    icon: Sun,
    to: '/quick-access/today',
    match: ['/quick-access/today', '/quick-access/tomorrow', '/quick-access/next-7-days'],
    primary: true,
  },
  { id: 'areas', labelKey: 'areas', icon: LayoutGrid, to: '/areas', match: ['/areas', '/projects'], primary: true },
  {
    id: 'calendar',
    labelKey: 'calendar',
    icon: CalendarDays,
    to: '/calendar',
    match: ['/calendar'],
    proOnly: true,
    primary: true,
  },
  {
    id: 'focus',
    labelKey: 'focus',
    icon: Target,
    to: '/quick-access/focus',
    match: ['/quick-access/focus'],
    primary: false,
  },
  { id: 'ai', labelKey: 'ai', icon: Bot, to: '/ai', match: ['/ai'], primary: false },
];

export const PRIMARY_DESTINATIONS = NAV_DESTINATIONS.filter(d => d.primary);
export const OVERFLOW_DESTINATIONS = NAV_DESTINATIONS.filter(d => !d.primary);

// Rail-only: the BottomNav reaches Settings through the Topbar account menu.
export const SETTINGS_DESTINATION: NavDestination = {
  id: 'settings',
  labelKey: 'settings',
  icon: Settings,
  to: '/settings',
  match: ['/settings'],
  primary: true,
};

export const isActive = (pathname: string, dest: NavDestination) =>
  dest.match.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
