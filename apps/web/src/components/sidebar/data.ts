import { Calendar, CalendarClock, Inbox, MoonIcon } from 'lucide-react';

export interface QuickAccessItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

export const quickAccessItems = [
  {
    title: 'Inbox',
    url: '/tasks/inbox',
    icon: Inbox,
  },
  {
    title: 'Today',
    url: '/tasks/today',
    icon: Calendar,
  },
  {
    title: 'Tomorrow',
    url: '/tasks/tomorrow',
    icon: MoonIcon,
  },
  {
    title: 'Next 7 Days',
    url: '/tasks/next-7-days',
    icon: CalendarClock,
  },
];
