import { useState } from 'react';

import { Popover } from '@/components/ui/popover';

import { NotificationBell } from './components/NotificationBell';
import { NotificationPanel } from './components/NotificationPanel';

// The notifications affordance: the polled bell (badge) and the on-demand panel,
// joined by a single Popover whose open state gates the panel's list fetch.
export const Notifications = () => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <NotificationBell />
      <NotificationPanel open={open} />
    </Popover>
  );
};
