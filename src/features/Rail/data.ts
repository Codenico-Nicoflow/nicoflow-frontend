import { Inbox, LayoutGrid, type LucideIcon, Settings, Sun } from 'lucide-react';

export interface NavDestination {
  label: string;
  icon: LucideIcon;
  to: string;
  /** Prefix used for active-state matching (e.g. Areas stays active on /projects/:id). */
  match: string[];
}

// Primary destinations, shared by the desktop Rail and the mobile BottomNav.
export const NAV_DESTINATIONS: NavDestination[] = [
  { label: 'Today', icon: Sun, to: '/quick-access/today', match: ['/quick-access/today'] },
  { label: 'Inbox', icon: Inbox, to: '/quick-access/bucket', match: ['/quick-access/bucket'] },
  { label: 'Areas', icon: LayoutGrid, to: '/areas', match: ['/areas', '/projects'] },
];

export const SETTINGS_DESTINATION: NavDestination = {
  label: 'Settings',
  icon: Settings,
  to: '/settings',
  match: ['/settings'],
};

export const isActive = (pathname: string, dest: NavDestination) =>
  dest.match.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
