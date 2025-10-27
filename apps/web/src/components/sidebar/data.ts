import { Calendar, CalendarClock, Inbox, MoonIcon } from 'lucide-react';

export interface QuickAccessItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

export const quickAccessItems = [
  {
    title: 'Bucket',
    url: '/quick-access/bucket',
    icon: Inbox,
  },
  {
    title: 'Today',
    url: '/quick-access/today',
    icon: Calendar,
  },
  {
    title: 'Tomorrow',
    url: '/quick-access/tomorrow',
    icon: MoonIcon,
  },
  {
    title: 'Next 7 Days',
    url: '/quick-access/next-7-days',
    icon: CalendarClock,
  },
];
