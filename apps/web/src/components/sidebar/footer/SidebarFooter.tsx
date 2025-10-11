import { useAuth, useUser } from '@clerk/clerk-react';

import { useSidebar } from '@/components/ui/sidebar';

import CollapsedFooter from './CollapsedFooter';
import OpenedFooter from './OpenedFooter';

const SidebarFooter = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return <CollapsedFooter handleLogout={signOut} isLoading={false} />;
  }

  if (!user) return null;

  return <OpenedFooter user={user} handleLogout={signOut} isLoading={false} />;
};

export default SidebarFooter;
